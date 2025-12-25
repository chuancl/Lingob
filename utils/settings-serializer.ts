
import { AutoTranslateConfig, PageWidgetConfig, WordInteractionConfig, TranslationEngine, DictionaryEngine, AnkiConfig, StyleConfig, OriginalTextConfig, Scenario, WordCategory } from "../types";

interface AllSettings {
    autoTranslate: AutoTranslateConfig;
    pageWidgetConfig: PageWidgetConfig;
    interactionConfig: WordInteractionConfig;
    engines: TranslationEngine[];
    dictionaries: DictionaryEngine[];
    ankiConfig: AnkiConfig;
    styles: Record<WordCategory, StyleConfig>;
    originalTextConfig: OriginalTextConfig;
    scenarios: Scenario[];
}

const indent = (level: number) => '  '.repeat(level);

const stringifyValue = (val: any, level: number): string => {
    if (Array.isArray(val)) {
        if (val.length === 0) return '[]';
        // Check if array contains objects
        if (val.some(v => typeof v === 'object' && v !== null)) {
            let str = '';
            val.forEach((item) => {
               str += `\n${indent(level)}- `;
               // If item is object, format it properly, indented relative to the dash
               if (typeof item === 'object') {
                   const objStr = stringifyObject(item, level + 1, false); // false = dont print braces if simpler, but here we want pure YAML lines
                   // Trim leading newline from objStr to fit after "- "
                   str += objStr.replace(/^\n\s*/, ''); 
               } else {
                   str += JSON.stringify(item);
               }
            });
            return str;
        }
        return JSON.stringify(val);
    }
    if (typeof val === 'object' && val !== null) {
        return '\n' + stringifyObject(val, level + 1);
    }
    if (typeof val === 'string') return JSON.stringify(val); // Quote strings
    return String(val);
}

const stringifyObject = (obj: any, level: number, addLeadingNewline = true): string => {
    let str = '';
    const keys = Object.keys(obj);
    keys.forEach((key, index) => {
        const val = obj[key];
        str += `${indent(level)}${key}: ${stringifyValue(val, level)}`;
        if (index < keys.length - 1) str += '\n';
    });
    return str;
}

const generateFieldComment = (key: string, value: any, comment?: string, options?: string) => {
    const lines = [];
    if (comment) lines.push(`# ${comment}`);
    if (options) lines.push(`# 可选值: ${options}`);
    return lines.map(l => `${indent(1)}${l}`).join('\n');
};

const buildYamlSection = (key: string, obj: any, schema: Record<string, { comment: string, options?: string }>) => {
    let yaml = `${key}:\n`;
    Object.keys(obj).forEach(k => {
        const meta = schema[k];
        if (meta) {
            yaml += `${generateFieldComment(k, obj[k], meta.comment, meta.options)}\n`;
        }
        yaml += `${indent(1)}${k}: ${stringifyValue(obj[k], 1)}\n\n`;
    });
    return yaml;
};

export const generateSettingsYaml = (settings: AllSettings): string => {
    let yaml = `# ContextLingo 配置文件备份
# 导出时间: ${new Date().toLocaleString()}
# 
# 说明：此文件包含您的所有个性化设置（不含词库数据）。
# 您可以修改此文件后重新导入，请严格保持 YAML 缩进格式。
# 
# ------------------------------------------------------------------

`;

    // 1. Auto Translate (General)
    yaml += buildYamlSection('auto_translate', settings.autoTranslate, {
        enabled: { comment: '总开关：是否启用插件', options: 'true (开启), false (关闭)' },
        bilingualMode: { comment: '双语对照模式：段落末尾追加译文', options: 'true, false' },
        translateWholePage: { comment: '全页扫描：包含侧边栏、页脚等非核心区域', options: 'true, false' },
        matchInflections: { comment: '词态匹配：自动识别复数、时态等变形', options: 'true, false' },
        aggressiveMode: { comment: '激进模式：调用 API 获取所有释义进行二次模糊匹配 (耗流量)', options: 'true, false' },
        blacklist: { comment: '黑名单域名列表 (不翻译)', options: 'Array of strings (e.g. ["baidu.com"])' },
        whitelist: { comment: '白名单域名列表 (强制翻译)', options: 'Array of strings' },
        ttsSpeed: { comment: 'TTS 朗读速度倍率', options: '0.25 - 3.0' }
    });

    // 2. Interaction (Bubble)
    yaml += buildYamlSection('interaction', settings.interactionConfig, {
        mainTrigger: { comment: '查词弹窗触发方式', options: 'Object { modifier, action, delay }' },
        quickAddTrigger: { comment: '快速添加(至正在学)触发方式', options: 'Object { modifier, action, delay }' },
        bubblePosition: { comment: '气泡出现位置', options: '"top", "bottom", "left", "right"' },
        showPhonetic: { comment: '气泡内显示音标', options: 'true, false' },
        showOriginalText: { comment: '气泡内显示原文', options: 'true, false' },
        showDictExample: { comment: '气泡内显示词典例句', options: 'true, false' },
        showDictTranslation: { comment: '气泡内显示释义', options: 'true, false' },
        autoPronounce: { comment: '气泡出现时自动朗读', options: 'true, false' },
        autoPronounceAccent: { comment: '自动朗读口音', options: '"US" (美音), "UK" (英音)' },
        autoPronounceCount: { comment: '自动朗读次数', options: 'Integer (0-5)' },
        dismissDelay: { comment: '气泡自动消失延迟 (毫秒)', options: 'Integer' },
        allowMultipleBubbles: { comment: '允许同时存在多个气泡', options: 'true, false' },
        onlineDictUrl: { comment: '在线词典跳转链接模板', options: 'String (使用 {word} 占位)' }
    });

    // 3. Page Widget
    yaml += buildYamlSection('page_widget', settings.pageWidgetConfig, {
        enabled: { comment: '是否启用悬浮球', options: 'true, false' },
        x: { comment: '悬浮球 X 坐标 (自动保存)', options: 'Number' },
        y: { comment: '悬浮球 Y 坐标 (自动保存)', options: 'Number' },
        showPhonetic: { comment: '弹窗列表显示音标', options: 'true, false' },
        showMeaning: { comment: '弹窗列表显示释义', options: 'true, false' },
        showMultiExamples: { comment: '弹窗列表显示多条例句', options: 'true, false' },
        showExampleTranslation: { comment: '显示例句翻译', options: 'true, false' },
        showContextTranslation: { comment: '显示原句翻译', options: 'true, false' },
        showInflections: { comment: '显示词态变化', options: 'true, false' },
        showPartOfSpeech: { comment: '显示词性', options: 'true, false' },
        showTags: { comment: '显示等级标签', options: 'true, false' },
        showImportance: { comment: '显示星级', options: 'true, false' },
        showCocaRank: { comment: '显示 COCA 排名', options: 'true, false' },
        showSections: { comment: '显示的单词分类', options: '{ known: bool, want: bool, learning: bool }' },
        cardDisplay: { comment: '卡片内容排序与开关', options: 'Array of objects' }
    });

    // 4. Anki
    yaml += buildYamlSection('anki', settings.ankiConfig, {
        enabled: { comment: '启用 Anki 集成', options: 'true, false' },
        url: { comment: 'AnkiConnect 地址', options: 'URL string' },
        deckNameWant: { comment: '“想学习”单词导入牌组', options: 'String' },
        deckNameLearning: { comment: '“正在学”单词导入牌组', options: 'String' },
        modelName: { comment: '使用的笔记模板名称', options: 'String' },
        syncInterval: { comment: '自动掌握判定天数', options: 'Integer' },
        autoSync: { comment: '自动同步开关', options: 'true, false' },
        templates: { comment: '卡片模板 (HTML)', options: '{ frontTemplate, backTemplate }' }
    });

    // 5. Original Text & Layout
    yaml += buildYamlSection('layout_style', settings.originalTextConfig, {
        show: { comment: '是否显示原文', options: 'true, false' },
        activeMode: { comment: '布局模式', options: '"horizontal" (水平), "vertical" (垂直)' },
        horizontal: { comment: '水平布局详细配置', options: 'Object' },
        vertical: { comment: '垂直布局详细配置', options: 'Object' },
        style: { comment: '原文样式配置', options: 'Object (color, fontSize, etc.)' }
    });

    // 6. Visual Styles (Map)
    yaml += `# ------------------------------------------------------------------
# 视觉样式配置 (各状态单词样式)
# ------------------------------------------------------------------
visual_styles:
`;
    Object.entries(settings.styles).forEach(([cat, style]) => {
        yaml += `  # 状态: ${cat}\n  "${cat}":\n`;
        yaml += `    color: "${style.color}" # 文字颜色\n`;
        yaml += `    backgroundColor: "${style.backgroundColor}" # 背景颜色\n`;
        yaml += `    isBold: ${style.isBold} # 加粗\n`;
        yaml += `    isItalic: ${style.isItalic} # 斜体\n`;
        yaml += `    fontSize: "${style.fontSize}" # 字号\n`;
        yaml += `    underlineStyle: "${style.underlineStyle}" # 下划线样式 (solid, dotted, wavy, none)\n`;
        yaml += `    underlineColor: "${style.underlineColor}" # 下划线颜色\n`;
        yaml += `    densityMode: "${style.densityMode}" # 密度模式 (count/percent)\n`;
        yaml += `    densityValue: ${style.densityValue} # 密度值\n\n`;
    });

    // 7. Scenarios
    yaml += `# ------------------------------------------------------------------
# 场景列表
# ------------------------------------------------------------------
scenarios: ${stringifyValue(settings.scenarios, 0)}\n\n`;

    // 8. Engines (Include secrets but minimal comments for array items)
    yaml += `# ------------------------------------------------------------------
# 翻译引擎配置 (包含 API Key，请妥善保管)
# ------------------------------------------------------------------
engines: ${stringifyValue(settings.engines, 0)}\n\n`;

    // 9. Dictionaries
    yaml += `# ------------------------------------------------------------------
# 词典源配置
# ------------------------------------------------------------------
dictionaries: ${stringifyValue(settings.dictionaries, 0)}\n`;

    return yaml;
};