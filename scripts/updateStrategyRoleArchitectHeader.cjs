const fs = require('fs');
const path = './src/views/organization/StrategyRoleArchitect.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Conditionally render legacy action toolbar only when activeTab !== 'role-studio'
const oldToolbar = `{/* Right: Action Toolbar with Standard Heights & Paddings */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">`;

const newToolbar = `{/* Right: Action Toolbar with Standard Heights & Paddings */}
          {activeTab !== 'role-studio' && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">`;

content = content.replace(oldToolbar, newToolbar);

// Close the conditional for toolbar before `</div>\n        </div>\n        {/* Subtitle Description */}`
const oldToolbarClose = `</button>
          </div>
        </div>
        {/* Subtitle Description */}`;

const newToolbarClose = `</button>
          </div>
          )}
        </div>
        {/* Subtitle Description */}`;

content = content.replace(oldToolbarClose, newToolbarClose);

// 2. Conditionally render the 6 KPI stats only when activeTab !== 'role-studio'
content = content.replace(
  "{/* Unified Executive Scorecard Ribbon - Clean 6 KPI Stats */}\n      {(() => {",
  "{/* Unified Executive Scorecard Ribbon - Clean 6 KPI Stats */}\n      {activeTab !== 'role-studio' && (() => {"
);

content = content.replace(
  "{/* Unified Executive Scorecard Ribbon - Clean 6 KPI Stats */}\r\n      {(() => {",
  "{/* Unified Executive Scorecard Ribbon - Clean 6 KPI Stats */}\r\n      {activeTab !== 'role-studio' && (() => {"
);

// Close the conditional for KPI ribbon
const oldKpiClose = `            {/* 6: Strategic Skills Taxonomy */}\n            <div className="bg-gradient-to-b from-teal-50/80 via-teal-50/20 to-white border border-teal-200/80 border-t-2 border-t-teal-600 rounded-xl px-3 py-2 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between min-w-0 h-[76px]">\n              <div className="text-[10px] font-bold text-teal-800/90 uppercase tracking-wider truncate">\n                Strategic Taxonomy\n              </div>\n              <div className="text-lg font-extrabold text-teal-600 leading-none truncate">\n                {summaryData.key_skills_count || 60}\n              </div>\n              <div className="text-[9.5px] font-medium text-teal-600/70 truncate">\n                Future skills mapped\n              </div>\n            </div>\n\n          </div>\n        );\n      })()}`;

const oldKpiClosePattern = "Future skills mapped\n              </div>\n            </div>\n\n          </div>\n        );\n      })()}";
const oldKpiClosePatternCRLF = "Future skills mapped\r\n              </div>\r\n            </div>\r\n\r\n          </div>\r\n        );\r\n      })()}";

if (content.includes(oldKpiClosePattern)) {
  content = content.replace(oldKpiClosePattern, oldKpiClosePattern + ")}");
} else if (content.includes(oldKpiClosePatternCRLF)) {
  content = content.replace(oldKpiClosePatternCRLF, oldKpiClosePatternCRLF + ")}");
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated StrategyRoleArchitect.tsx');
