#include <windows.h>
#include <cstdint>

// Byte signature of the token comparison we want to hook
// 3B 48 10 75 39 0F B7 4B 14 66 3B 48 14 75 2F
static const BYTE TARGET_SIG[] = {
    0x3B, 0x48, 0x10, 0x75, 0x39, 0x0F, 0xB7, 0x4B,
    0x14, 0x66, 0x3B, 0x48, 0x14, 0x75, 0x2F
};
static const size_t SIG_LEN = sizeof(TARGET_SIG);

// Offsets of the two jne instructions within the signature
static const size_t JNE1_OFFSET = 3;   // 75 39
static const size_t JNE2_OFFSET = 13;  // 75 2F

static bool g_patched = false;

BYTE* FindSignature(BYTE* base, size_t size) {
    for (size_t i = 0; i < size - SIG_LEN; i++) {
        bool match = true;
        for (size_t j = 0; j < SIG_LEN; j++) {
            if (base[i + j] != TARGET_SIG[j]) { match = false; break; }
        }
        if (match) return base + i;
    }
    return nullptr;
}

bool PatchMemory(BYTE* addr, BYTE* patch, size_t len) {
    DWORD oldProt;
    if (!VirtualProtect(addr, len, PAGE_EXECUTE_READWRITE, &oldProt)) return false;
    memcpy(addr, patch, len);
    VirtualProtect(addr, len, oldProt, &oldProt);
    FlushInstructionCache(GetCurrentProcess(), addr, len);
    return true;
}

void ApplyPatch() {
    if (g_patched) return;

    HMODULE hModule = GetModuleHandle(NULL);
    if (!hModule) return;

    MODULEINFO modInfo = {};
    GetModuleInformation(GetCurrentProcess(), hModule, &modInfo, sizeof(modInfo));

    BYTE* base = (BYTE*)hModule;
    size_t size = modInfo.SizeOfImage;

    BYTE* target = FindSignature(base, size);
    if (!target) {
        OutputDebugStringA("[IsleHook] Signature not found!\n");
        return;
    }

    BYTE nop2[] = { 0x90, 0x90 };
    bool ok1 = PatchMemory(target + JNE1_OFFSET, nop2, 2);
    bool ok2 = PatchMemory(target + JNE2_OFFSET, nop2, 2);

    if (ok1 && ok2) {
        g_patched = true;
        OutputDebugStringA("[IsleHook] Token comparison patched successfully.\n");
    } else {
        OutputDebugStringA("[IsleHook] Failed to patch!\n");
    }
}

BOOL APIENTRY DllMain(HMODULE hModule, DWORD reason, LPVOID reserved) {
    if (reason == DLL_PROCESS_ATTACH) {
        DisableThreadLibraryCalls(hModule);
        // Run patch in a separate thread to avoid loader lock issues
        CreateThread(nullptr, 0, [](LPVOID) -> DWORD {
            Sleep(5000); // Wait for server to fully initialize
            ApplyPatch();
            return 0;
        }, nullptr, 0, nullptr);
    }
    return TRUE;
}