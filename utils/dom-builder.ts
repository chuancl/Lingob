
import { WordCategory, StyleConfig, OriginalTextConfig } from "../types";
import { getStyleStr } from "./style-helper";

/**
 * Builds the HTML string for a replaced word, applying layout and styles.
 * NOW USES: Category-specific layout settings from StyleConfig.
 */
export const buildReplacementHtml = (
    targetChinese: string, 
    englishReplacement: string, 
    category: WordCategory,
    styles: Record<WordCategory, StyleConfig>,
    originalTextConfig: OriginalTextConfig,
    entryId: string
): string => {
    const styleConfig = styles[category];
    
    // Fallbacks if new structure is missing (e.g., old storage data)
    const layoutMode = styleConfig.layoutMode || 'horizontal';
    const activeLayout = layoutMode === 'horizontal' 
        ? (styleConfig.horizontal || { translationFirst: false, wrappers: { translation: {prefix:'', suffix:''}, original: {prefix:'(', suffix:')'} } })
        : (styleConfig.vertical || { translationFirst: true, baselineTarget: 'translation', wrappers: { translation: {prefix:'', suffix:''}, original: {prefix:'', suffix:''} } });

    // Wrappers
    const transPrefix = activeLayout.wrappers.translation.prefix;
    const transSuffix = activeLayout.wrappers.translation.suffix;
    const origPrefix = activeLayout.wrappers.original.prefix;
    const origSuffix = activeLayout.wrappers.original.suffix;

    const isVertical = layoutMode === 'vertical';
    
    // Determine baseline roles for Vertical mode
    const baselineTarget = activeLayout.baselineTarget || 'original';
    const isTransBase = baselineTarget === 'translation';

    // Style Overrides for Vertical Alignment
    const transBaseStyle = getStyleStr(styleConfig);
    
    // Construct Original Text Style based on isolated config
    const origStyle = {
        color: styleConfig.originalTextColor || '#94a3b8',
        fontSize: styleConfig.originalTextFontSize || '0.85em',
        backgroundColor: 'transparent',
        isBold: false, 
        isItalic: false,
        underlineStyle: 'none',
        underlineColor: 'transparent',
        underlineOffset: '0px'
    } as StyleConfig;
    const origBaseStyle = getStyleStr(origStyle);

    let transOverride = '';
    let origOverride = '';

    if (isVertical) {
        if (isTransBase) {
            // Translation is Base
            transOverride = `line-height: normal; vertical-align: baseline; font-size: ${styleConfig.fontSize};`;
            // Original is RT -> Compact
            origOverride = 'line-height: 1;'; 
        } else {
            // Original is Base
            origOverride = `line-height: normal; vertical-align: baseline; font-size: ${origStyle.fontSize};`;
            // Translation is RT -> Compact
            transOverride = 'line-height: 1;';
        }
    }

    // 1. Translation Element
    const transInner = `<span style="${transBaseStyle} border-bottom: 2px solid transparent; ${transOverride}" 
       class="context-lingo-target"
       data-entry-id="${entryId}"
       data-original-text="${targetChinese}"
       onmouseover="this.style.borderColor='rgba(59, 130, 246, 0.5)'" 
       onmouseout="this.style.borderColor='transparent'"
       >${transPrefix}${englishReplacement}${transSuffix}</span>`;

    // 2. Original Element (Optional)
    let origInner = '';
    if (originalTextConfig.show) {
        origInner = `<span style="${origBaseStyle} white-space: nowrap; ${origOverride}">${origPrefix}${targetChinese}${origSuffix}</span>`;
    }

    // 3. Layout Construction
    if (!originalTextConfig.show) {
        return `<span class="context-lingo-wrapper" style="margin: 0; padding: 0; display: inline;">${transInner}</span>`;
    }

    if (layoutMode === 'horizontal') {
        const first = activeLayout.translationFirst ? transInner : origInner;
        const second = activeLayout.translationFirst ? origInner : transInner;
        
        return `<span class="context-lingo-wrapper" style="margin: 0; padding: 0; display: inline;">${first}${second}</span>`;
    } else {
        // Vertical Layout (Ruby)
        const baseInner = isTransBase ? transInner : origInner;
        const rtInner = isTransBase ? origInner : transInner;

        let rubyPosition = 'over';
        if (activeLayout.translationFirst) {
            if (isTransBase) rubyPosition = 'under';
            else rubyPosition = 'over';
        } else {
            if (isTransBase) rubyPosition = 'over';
            else rubyPosition = 'under';
        }

        return `<ruby class="context-lingo-wrapper" style="ruby-position: ${rubyPosition}; margin: 0; padding: 0; ruby-align: start; -webkit-ruby-align: start; text-align: left;">${baseInner}<rt style="font-size: 100%; font-family: inherit;">${rtInner}</rt></ruby>`;
    }
};