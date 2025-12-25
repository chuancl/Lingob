
import React, { useState } from 'react';
import { WordCategory, StyleConfig, OriginalTextConfig, LayoutSpecificConfig } from '../types';
import { Bold, Italic, MoveHorizontal, MoveVertical, AlignEndHorizontal, Percent, Hash, Info, AlignVerticalJustifyCenter, Type } from 'lucide-react';
import { getStyleStr } from '../utils/style-helper';

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  return (
    <div className="group relative flex items-center">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
};

interface VisualStylesSectionProps {
    styles: Record<WordCategory, StyleConfig>;
    onStylesChange: (newStyles: Record<WordCategory, StyleConfig>) => void;
    originalTextConfig: OriginalTextConfig;
    onOriginalTextConfigChange: (newConfig: OriginalTextConfig) => void;
}

export const VisualStylesSection: React.FC<VisualStylesSectionProps> = ({ styles, onStylesChange, originalTextConfig, onOriginalTextConfigChange }) => {
  const [activeTab, setActiveTab] = useState<WordCategory>(Object.values(WordCategory)[0]);

  const currentConfig = styles[activeTab];

  const updateCurrentConfig = (updates: Partial<StyleConfig>) => {
    onStylesChange({
      ...styles,
      [activeTab]: { ...currentConfig, ...updates }
    });
  };

  const updateLayoutConfig = (mode: 'horizontal' | 'vertical', field: string, value: any, subField?: string) => {
     const currentModeConfig = currentConfig[mode];
     let newModeConfig: LayoutSpecificConfig = { ...currentModeConfig };
     
     if (field === 'wrappers' && subField) {
        const [type, prop] = subField.split('.') as ['translation' | 'original', 'prefix' | 'suffix'];
        newModeConfig.wrappers = {
            ...currentModeConfig.wrappers,
            [type]: {
                ...currentModeConfig.wrappers[type],
                [prop]: value
            }
        };
     } else {
        newModeConfig = { ...newModeConfig, [field]: value };
     }
     
     updateCurrentConfig({ [mode]: newModeConfig });
  };

  // --- Preview Engine ---
  const WordPreview = () => {
    const replacementText = "remember";
    const originalText = "记住";

    // Use current active config for preview
    const layoutMode = currentConfig.layoutMode;
    const activeLayout = layoutMode === 'horizontal' ? currentConfig.horizontal : currentConfig.vertical;
    const isVertical = layoutMode === 'vertical';
    const baselineTarget = activeLayout.baselineTarget || 'original';
    const isTransBase = baselineTarget === 'translation';

    // Helper to build styles
    const getTransStyle = (): React.CSSProperties => {
        const base: React.CSSProperties = {
            color: currentConfig.color,
            backgroundColor: currentConfig.backgroundColor,
            fontWeight: currentConfig.isBold ? 'bold' : 'normal',
            fontStyle: currentConfig.isItalic ? 'italic' : 'normal',
            textDecorationLine: currentConfig.underlineStyle !== 'none' ? 'underline' : 'none',
            textDecorationStyle: currentConfig.underlineStyle !== 'none' ? (currentConfig.underlineStyle as any) : undefined,
            textDecorationColor: currentConfig.underlineColor,
            textUnderlineOffset: currentConfig.underlineOffset,
            fontSize: currentConfig.fontSize,
        };
        if (isVertical) {
            if (isTransBase) return { ...base, lineHeight: 'normal', verticalAlign: 'baseline' };
            else return { ...base, lineHeight: '1' };
        }
        return base;
    };

    const getOrigStyle = (): React.CSSProperties => {
        const base: React.CSSProperties = {
            color: currentConfig.originalTextColor,
            fontSize: currentConfig.originalTextFontSize,
        };
        if (isVertical) {
            if (!isTransBase) return { ...base, lineHeight: 'normal', verticalAlign: 'baseline' };
            else return { ...base, lineHeight: '1' };
        }
        return base;
    };

    const transPrefix = activeLayout.wrappers.translation.prefix;
    const transSuffix = activeLayout.wrappers.translation.suffix;
    const origPrefix = activeLayout.wrappers.original.prefix;
    const origSuffix = activeLayout.wrappers.original.suffix;

    const TransComponent = (
        <span style={getTransStyle()} className="whitespace-nowrap border-b-2 border-transparent hover:border-blue-200 transition-colors">
            {transPrefix}{replacementText}{transSuffix}
        </span>
    );

    const OrigComponent = (
        <span style={getOrigStyle()} className="whitespace-nowrap">
            {origPrefix}{originalText}{origSuffix}
        </span>
    );

    if (!originalTextConfig.show) {
       return (
        <div className="text-lg text-slate-500 flex flex-col items-center justify-center min-h-[140px] leading-relaxed">
            <div className="flex items-baseline flex-wrap justify-center">
                <span className="mr-1">每次网上冲浪时，我都能</span>
                {TransComponent}
                <span className="ml-1">更多的单词。</span>
            </div>
        </div>
       );
    }

    let content;
    const { translationFirst } = activeLayout;

    if (layoutMode === 'horizontal') {
        content = (
            <span className="inline items-baseline">
                {translationFirst ? TransComponent : OrigComponent}
                {translationFirst ? OrigComponent : TransComponent}
            </span>
        );
    } else {
        const BaseComp = isTransBase ? TransComponent : OrigComponent;
        const RtComp = isTransBase ? OrigComponent : TransComponent;
        let rubyPosition: 'over' | 'under' = 'over';
        if (translationFirst) {
            if (isTransBase) rubyPosition = 'under';
            else rubyPosition = 'over';
        } else {
            if (isTransBase) rubyPosition = 'over';
            else rubyPosition = 'under';
        }
        content = (
           <ruby style={{ rubyPosition, margin: '0', rubyAlign: 'start', textAlign: 'left' } as any}>
              {BaseComp}
              <rt style={{ fontFamily: 'inherit', fontSize: '100%' }}>{RtComp}</rt>
           </ruby>
        );
    }

    return (
       <div className="text-lg text-slate-500 flex flex-col items-center justify-center min-h-[140px]">
          <div className="text-center leading-loose">
             <span>每次网上冲浪时，我都能</span>
             {content}
             <span className="ml-1">更多的单词。</span>
          </div>
       </div>
    );
  };

  const WrapperInput = ({ value, onChange, placeholder = "" }: { value: string, onChange: (v: string) => void, placeholder?: string }) => (
      <input 
         type="text" 
         value={value} 
         onChange={e => onChange(e.target.value)}
         placeholder={placeholder}
         className="w-8 h-8 p-0 text-center text-xs border border-slate-200 rounded bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition-all placeholder:text-slate-300"
      />
  );

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <div>
            <h2 className="text-lg font-bold text-slate-800">视觉样式配置</h2>
            <p className="text-sm text-slate-500 mt-1">每个状态（分类）的单词均可配置独立的样式与布局结构。</p>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">全局显示原文</span>
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                type="checkbox" 
                checked={originalTextConfig.show} 
                onChange={() => onOriginalTextConfigChange({...originalTextConfig, show: !originalTextConfig.show})}
                className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-slate-200 px-6 py-4 bg-white flex gap-2 overflow-x-auto hide-scrollbar">
         {Object.values(WordCategory).map(cat => (
             <button
               key={cat}
               onClick={() => setActiveTab(cat)}
               className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all flex items-center ${
                 activeTab === cat 
                   ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                   : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
               }`}
             >
               {cat}
             </button>
           ))}
      </div>

      <div className="p-8 space-y-12">
           {/* Preview Section */}
           <div>
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">实时预览 ({activeTab})</h3>
             <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 flex justify-center items-center min-h-[180px]">
                <WordPreview />
             </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Left Column: Translation Style */}
              <div>
                 <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-6 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                    译文样式 (Translation Style)
                 </h4>
                 
                 <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 block mb-1.5">文字颜色</label>
                            <input type="color" value={currentConfig.color} onChange={(e) => updateCurrentConfig({color: e.target.value})} className="w-full h-9 rounded border cursor-pointer" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 block mb-1.5">背景颜色</label>
                            <input type="color" value={currentConfig.backgroundColor} onChange={(e) => updateCurrentConfig({backgroundColor: e.target.value})} className="w-full h-9 rounded border cursor-pointer" />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={() => updateCurrentConfig({isBold: !currentConfig.isBold})} className={`flex-1 py-2 rounded border flex items-center justify-center text-xs font-medium transition ${currentConfig.isBold ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white text-slate-600'}`}>
                            <Bold className="w-3.5 h-3.5 mr-2" /> 加粗
                        </button>
                        <button onClick={() => updateCurrentConfig({isItalic: !currentConfig.isItalic})} className={`flex-1 py-2 rounded border flex items-center justify-center text-xs font-medium transition ${currentConfig.isItalic ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white text-slate-600'}`}>
                            <Italic className="w-3.5 h-3.5 mr-2" /> 斜体
                        </button>
                    </div>

                    <div>
                        <label className="text-xs text-slate-500 block mb-1.5">字号 (Size)</label>
                        <select value={currentConfig.fontSize} onChange={(e) => updateCurrentConfig({fontSize: e.target.value})} className="w-full text-xs border-slate-300 rounded-lg p-2.5">
                            <option value="0.75em">0.75x</option>
                            <option value="0.85em">0.85x</option>
                            <option value="1em">1x (正常)</option>
                            <option value="1.1em">1.1x</option>
                            <option value="1.25em">1.25x</option>
                            <option value="1.5em">1.5x</option>
                        </select>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <label className="text-xs font-bold text-slate-400 block mb-3 uppercase tracking-wider">下划线设置</label>
                        <div className="grid grid-cols-2 gap-3">
                            <select value={currentConfig.underlineStyle} onChange={(e) => updateCurrentConfig({underlineStyle: e.target.value as any})} className="w-full text-xs border-slate-300 rounded p-2">
                                <option value="none">无</option>
                                <option value="solid">实线</option>
                                <option value="dashed">虚线</option>
                                <option value="dotted">点线</option>
                                <option value="wavy">波浪线</option>
                            </select>
                            <input type="range" min="0" max="8" value={parseInt(currentConfig.underlineOffset)} onChange={(e) => updateCurrentConfig({underlineOffset: `${e.target.value}px`})} className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer self-center" />
                        </div>
                    </div>
                 </div>
              </div>

              {/* Right Column: Layout & Original Text Style */}
              <div>
                 <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-6">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center">
                       <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                       布局与原文 (Layout & Original)
                    </h4>
                 </div>
                 
                 {originalTextConfig.show ? (
                     <div className="space-y-6">
                        {/* Original Text Style */}
                        <div className="flex gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <div className="flex-1">
                                <label className="text-xs text-slate-500 block mb-1.5">原文颜色</label>
                                <input type="color" value={currentConfig.originalTextColor} onChange={(e) => updateCurrentConfig({originalTextColor: e.target.value})} className="w-full h-8 rounded border cursor-pointer" />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-slate-500 block mb-1.5">原文及包裹符字号</label>
                                <select value={currentConfig.originalTextFontSize} onChange={(e) => updateCurrentConfig({originalTextFontSize: e.target.value})} className="w-full text-xs border-slate-300 rounded p-1.5 h-8">
                                    <option value="0.75em">0.75x</option>
                                    <option value="0.85em">0.85x</option>
                                    <option value="1em">1x</option>
                                </select>
                            </div>
                        </div>

                        {/* Layout Mode Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => updateCurrentConfig({layoutMode: 'horizontal'})}
                                className={`p-4 rounded-xl border-2 transition-all text-left relative ${currentConfig.layoutMode === 'horizontal' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-blue-200'}`}
                            >
                                <MoveHorizontal className="w-5 h-5 mb-2 text-slate-500" />
                                <div className="text-xs font-bold text-slate-700">水平布局</div>
                                {currentConfig.layoutMode === 'horizontal' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500"></div>}
                            </button>
                            <button 
                                onClick={() => updateCurrentConfig({layoutMode: 'vertical'})}
                                className={`p-4 rounded-xl border-2 transition-all text-left relative ${currentConfig.layoutMode === 'vertical' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-blue-200'}`}
                            >
                                <MoveVertical className="w-5 h-5 mb-2 text-slate-500" />
                                <div className="text-xs font-bold text-slate-700">垂直堆叠</div>
                                {currentConfig.layoutMode === 'vertical' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500"></div>}
                            </button>
                        </div>

                        {/* Detail Builder */}
                        <div className="bg-white border border-slate-200 rounded-lg p-4 relative">
                            {currentConfig.layoutMode === 'horizontal' ? (
                                // Horizontal Builder
                                <div className="flex items-center justify-center overflow-x-auto py-2">
                                    <div className="flex items-center">
                                    <WrapperInput 
                                        value={currentConfig.horizontal.translationFirst ? currentConfig.horizontal.wrappers.translation.prefix : currentConfig.horizontal.wrappers.original.prefix}
                                        onChange={v => updateLayoutConfig('horizontal', 'wrappers', v, currentConfig.horizontal.translationFirst ? 'translation.prefix' : 'original.prefix')}
                                        placeholder={currentConfig.horizontal.translationFirst ? "" : "("}
                                    />
                                    <select 
                                        value={currentConfig.horizontal.translationFirst ? 'translation' : 'original'}
                                        onChange={e => updateLayoutConfig('horizontal', 'translationFirst', e.target.value === 'translation')}
                                        className="text-xs py-1 px-2 border-slate-200 bg-slate-50 rounded min-w-[60px] mx-1"
                                    >
                                        <option value="translation">译文</option>
                                        <option value="original">原文</option>
                                    </select>
                                    <WrapperInput 
                                        value={currentConfig.horizontal.translationFirst ? currentConfig.horizontal.wrappers.translation.suffix : currentConfig.horizontal.wrappers.original.suffix}
                                        onChange={v => updateLayoutConfig('horizontal', 'wrappers', v, currentConfig.horizontal.translationFirst ? 'translation.suffix' : 'original.suffix')}
                                        placeholder={currentConfig.horizontal.translationFirst ? "" : ")"}
                                    />
                                    </div>
                                    <span className="text-slate-300 mx-2">|</span>
                                    <div className="flex items-center">
                                    <WrapperInput 
                                        value={currentConfig.horizontal.translationFirst ? currentConfig.horizontal.wrappers.original.prefix : currentConfig.horizontal.wrappers.translation.prefix}
                                        onChange={v => updateLayoutConfig('horizontal', 'wrappers', v, currentConfig.horizontal.translationFirst ? 'original.prefix' : 'translation.prefix')}
                                        placeholder={currentConfig.horizontal.translationFirst ? "(" : ""}
                                    />
                                    <div className="text-xs py-1.5 px-3 bg-slate-100 text-slate-500 rounded border border-slate-200 min-w-[60px] text-center select-none mx-1">
                                        {currentConfig.horizontal.translationFirst ? '原文' : '译文'}
                                    </div>
                                    <WrapperInput 
                                        value={currentConfig.horizontal.translationFirst ? currentConfig.horizontal.wrappers.original.suffix : currentConfig.horizontal.wrappers.translation.suffix}
                                        onChange={v => updateLayoutConfig('horizontal', 'wrappers', v, currentConfig.horizontal.translationFirst ? 'original.suffix' : 'translation.suffix')}
                                        placeholder={currentConfig.horizontal.translationFirst ? ")" : ""}
                                    />
                                    </div>
                                </div>
                            ) : (
                                // Vertical Builder
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="text-[10px] text-slate-400 w-8 text-right">Top</span>
                                        <WrapperInput 
                                            value={currentConfig.vertical.translationFirst ? currentConfig.vertical.wrappers.translation.prefix : currentConfig.vertical.wrappers.original.prefix}
                                            onChange={v => updateLayoutConfig('vertical', 'wrappers', v, currentConfig.vertical.translationFirst ? 'translation.prefix' : 'original.prefix')}
                                        />
                                        <select 
                                            value={currentConfig.vertical.translationFirst ? 'translation' : 'original'}
                                            onChange={e => updateLayoutConfig('vertical', 'translationFirst', e.target.value === 'translation')}
                                            className="text-xs py-1 px-2 border-slate-200 bg-slate-50 rounded min-w-[70px]"
                                        >
                                            <option value="translation">译文(上)</option>
                                            <option value="original">原文(上)</option>
                                        </select>
                                        <WrapperInput 
                                            value={currentConfig.vertical.translationFirst ? currentConfig.vertical.wrappers.translation.suffix : currentConfig.vertical.wrappers.original.suffix}
                                            onChange={v => updateLayoutConfig('vertical', 'wrappers', v, currentConfig.vertical.translationFirst ? 'translation.suffix' : 'original.suffix')}
                                        />
                                    </div>
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="text-[10px] text-slate-400 w-8 text-right">Bottom</span>
                                        <WrapperInput 
                                            value={currentConfig.vertical.translationFirst ? currentConfig.vertical.wrappers.original.prefix : currentConfig.vertical.wrappers.translation.prefix}
                                            onChange={v => updateLayoutConfig('vertical', 'wrappers', v, currentConfig.vertical.translationFirst ? 'original.prefix' : 'translation.prefix')}
                                        />
                                        <div className="text-xs py-1.5 px-3 bg-slate-100 text-slate-500 rounded border border-slate-200 min-w-[70px] text-center select-none">
                                            {currentConfig.vertical.translationFirst ? '原文(下)' : '译文(下)'}
                                        </div>
                                        <WrapperInput 
                                            value={currentConfig.vertical.translationFirst ? currentConfig.vertical.wrappers.original.suffix : currentConfig.vertical.wrappers.translation.suffix}
                                            onChange={v => updateLayoutConfig('vertical', 'wrappers', v, currentConfig.vertical.translationFirst ? 'original.suffix' : 'translation.suffix')}
                                        />
                                    </div>
                                    <div className="border-t border-slate-100 pt-3 flex items-center justify-center gap-3">
                                        <span className="text-xs font-bold text-slate-500 flex items-center"><AlignVerticalJustifyCenter className="w-3 h-3 mr-1"/> 对齐基准</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => updateLayoutConfig('vertical', 'baselineTarget', 'original')} className={`px-2 py-1 text-[10px] rounded border ${currentConfig.vertical.baselineTarget === 'original' ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold' : 'bg-slate-50 border-slate-200'}`}>原文齐平</button>
                                            <button onClick={() => updateLayoutConfig('vertical', 'baselineTarget', 'translation')} className={`px-2 py-1 text-[10px] rounded border ${currentConfig.vertical.baselineTarget === 'translation' ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold' : 'bg-slate-50 border-slate-200'}`}>译文齐平</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                     </div>
                 ) : (
                    <div className="text-center py-16 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                       <Type className="w-8 h-8 mx-auto mb-2 opacity-20"/>
                       原文显示已关闭
                    </div>
                 )}
              </div>
           </div>

           {/* Density Configuration */}
           <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-6">
                 <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <AlignEndHorizontal className="w-3 h-3" />
                 </div>
                 <h4 className="text-sm font-bold text-slate-800">
                    替换密度配置 ({activeTab})
                 </h4>
                 <Tooltip text="控制网页上【该分类】单词的替换频率。例如设置50%，则页面上所有该分类的单词中，只有一半会被替换。">
                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                 </Tooltip>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row items-center gap-8">
                  {/* Toggle Mode */}
                  <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm shrink-0">
                      <button 
                         onClick={() => updateCurrentConfig({densityMode: 'count'})}
                         className={`flex items-center px-4 py-2 rounded-md text-sm transition-all ${currentConfig.densityMode === 'count' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                         <Hash className="w-4 h-4 mr-2" /> 固定数量 (Count)
                      </button>
                      <button 
                         onClick={() => updateCurrentConfig({densityMode: 'percent'})}
                         className={`flex items-center px-4 py-2 rounded-md text-sm transition-all ${currentConfig.densityMode === 'percent' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                         <Percent className="w-4 h-4 mr-2" /> 按百分比 (%)
                      </button>
                  </div>

                  {/* Slider & Input */}
                  <div className="flex-1 w-full flex items-center gap-4">
                      <div className="flex-1 relative h-6 flex items-center">
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full" 
                                style={{width: `${currentConfig.densityMode === 'percent' ? currentConfig.densityValue : Math.min(100, (currentConfig.densityValue / 50) * 100)}%`}}
                              ></div>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max={currentConfig.densityMode === 'percent' ? 100 : 50} 
                            step="1"
                            value={currentConfig.densityValue}
                            onChange={(e) => updateCurrentConfig({densityValue: parseInt(e.target.value)})}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div 
                             className="absolute w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow pointer-events-none transition-all"
                             style={{left: `${currentConfig.densityMode === 'percent' ? currentConfig.densityValue : Math.min(100, (currentConfig.densityValue / 50) * 100)}%`, transform: 'translateX(-50%)'}}
                          ></div>
                      </div>
                      
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white px-3 py-1.5 min-w-[80px]">
                          <input 
                            type="number" 
                            value={currentConfig.densityValue}
                            onChange={(e) => updateCurrentConfig({densityValue: Math.max(0, parseInt(e.target.value) || 0)})}
                            className="w-full text-right font-bold text-slate-700 outline-none text-sm mr-1"
                          />
                          <span className="text-xs text-slate-400 font-medium">
                              {currentConfig.densityMode === 'percent' ? '%' : '个'}
                          </span>
                      </div>
                  </div>
              </div>
           </div>
      </div>
    </section>
  );
};