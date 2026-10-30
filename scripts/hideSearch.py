path = 'src/views/organization/StrategyRoleArchitect.tsx'
content = open(path, 'r', encoding='utf-8').read()

target = """        {/* Search Box on Right of Tabs - Generously Sized, Luxuriously Padded Capsule */}
        <div className="flex items-center shrink-0 relative z-10">"""

replacement = """        {/* Search Box on Right of Tabs - Generously Sized, Luxuriously Padded Capsule */}
        {activeTab !== 'role-studio' && (
        <div className="flex items-center shrink-0 relative z-10">"""

if target in content:
    content = content.replace(target, replacement, 1)

target_close = """              <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 rounded-md font-mono select-none leading-none shadow-2xs">
                /
              </kbd>
            )}
          </div>
        </div>"""

replacement_close = """              <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 rounded-md font-mono select-none leading-none shadow-2xs">
                /
              </kbd>
            )}
          </div>
        </div>
        )}"""

if target_close in content:
    content = content.replace(target_close, replacement_close, 1)

open(path, 'w', encoding='utf-8').write(content)
print("Hidden search box on role-studio")
