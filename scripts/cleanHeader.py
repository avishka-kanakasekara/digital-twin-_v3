path = 'src/views/organization/StrategyRoleArchitect.tsx'
content = open(path, 'r', encoding='utf-8').read()

# 1. Hide legacy toolbar when activeTab === 'role-studio'
target_chunk = """          {/* Right: Action Toolbar with Standard Heights & Paddings */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">"""

replacement_chunk = """          {/* Right: Action Toolbar with Standard Heights & Paddings */}
          {activeTab !== 'role-studio' && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">"""

if target_chunk in content:
    content = content.replace(target_chunk, replacement_chunk, 1)

target_close = """            {/* Map Future Role Primary Action */}
            <button
              onClick={() => setIsCreateRoleOpen(true)}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-[0.98]"
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            >
              <Plus size={14} className="text-white shrink-0" />
              <span className="text-white">Map Future Role</span>
            </button>
          </div>
        </div>"""

replacement_close = """            {/* Map Future Role Primary Action */}
            <button
              onClick={() => setIsCreateRoleOpen(true)}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-[0.98]"
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            >
              <Plus size={14} className="text-white shrink-0" />
              <span className="text-white">Map Future Role</span>
            </button>
          </div>
          )}
        </div>"""

if target_close in content:
    content = content.replace(target_close, replacement_close, 1)

open(path, 'w', encoding='utf-8').write(content)
print("Updated toolbar conditional")
