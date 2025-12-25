
import React, { useState, useRef } from 'react';
import { 
    Scenario, PageWidgetConfig, AutoTranslateConfig, TranslationEngine, 
    DictionaryEngine, AnkiConfig, StyleConfig, OriginalTextConfig, 
    WordInteractionConfig, WordCategory 
} from '../../types';
import { ArchiveRestore, Download, Upload, AlertTriangle, CheckCircle2, FileText, RefreshCw, Copy } from 'lucide-react';
import { generateSettingsYaml } from '../../utils/settings-serializer';
import { Toast, ToastMessage } from '../ui/Toast';
import jsyaml from 'js-yaml';

interface BackupRestoreSectionProps {
    configs: {
        scenarios: Scenario[];
        pageWidgetConfig: PageWidgetConfig;
        autoTranslate: AutoTranslateConfig;
        engines: TranslationEngine[];
        dictionaries: DictionaryEngine[];
        ankiConfig: AnkiConfig;
        styles: Record<WordCategory, StyleConfig>;
        originalTextConfig: OriginalTextConfig;
        interactionConfig: WordInteractionConfig;
    };
    setters: {
        setScenarios: (v: Scenario[]) => void;
        setPageWidgetConfig: (v: PageWidgetConfig) => void;
        setAutoTranslate: (v: AutoTranslateConfig) => void;
        setEngines: (v: TranslationEngine[]) => void;
        setDictionaries: (v: DictionaryEngine[]) => void;
        setAnkiConfig: (v: AnkiConfig) => void;
        setStyles: (v: Record<WordCategory, StyleConfig>) => void;
        setOriginalTextConfig: (v: OriginalTextConfig) => void;
        setInteractionConfig: (v: WordInteractionConfig) => void;
    };
}

export const BackupRestoreSection: React.FC<BackupRestoreSectionProps> = ({ configs, setters }) => {
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [previewContent, setPreviewContent] = useState<string>('');
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
        setToast({ id: Date.now(), message, type });
    };

    const handleExport = () => {
        try {
            const yaml = generateSettingsYaml(configs);
            const blob = new Blob([yaml], { type: 'text/yaml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reword_settings_backup_${new Date().toISOString().slice(0, 10)}.yaml`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('配置导出成功', 'success');
        } catch (e: any) {
            showToast(`导出失败: ${e.message}`, 'error');
        }
    };

    const handleCopy = () => {
        try {
            const yaml = generateSettingsYaml(configs);
            navigator.clipboard.writeText(yaml);
            showToast('配置已复制到剪贴板', 'success');
        } catch (e: any) {
            showToast('复制失败', 'error');
        }
    };

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setPreviewContent(content);
            setIsImporting(true);
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    };

    const applyImport = () => {
        if (!previewContent.trim()) return;

        try {
            const parsed: any = jsyaml.load(previewContent);
            
            if (!parsed || typeof parsed !== 'object') throw new Error("无效的 YAML 格式");

            let updateCount = 0;

            if (parsed.auto_translate) { setters.setAutoTranslate(parsed.auto_translate); updateCount++; }
            if (parsed.interaction) { setters.setInteractionConfig(parsed.interaction); updateCount++; }
            if (parsed.page_widget) { setters.setPageWidgetConfig(parsed.page_widget); updateCount++; }
            if (parsed.anki) { setters.setAnkiConfig(parsed.anki); updateCount++; }
            if (parsed.layout_style) { setters.setOriginalTextConfig(parsed.layout_style); updateCount++; }
            if (parsed.visual_styles) { setters.setStyles(parsed.visual_styles); updateCount++; }
            if (parsed.scenarios) { setters.setScenarios(parsed.scenarios); updateCount++; }
            if (parsed.engines) { setters.setEngines(parsed.engines); updateCount++; }
            if (parsed.dictionaries) { setters.setDictionaries(parsed.dictionaries); updateCount++; }

            if (updateCount > 0) {
                showToast(`成功恢复 ${updateCount} 项配置模块`, 'success');
                setIsImporting(false);
                setPreviewContent('');
            } else {
                showToast('未识别到有效的配置项，请检查 YAML 结构', 'warning');
            }

        } catch (e: any) {
            showToast(`解析失败: ${e.message}`, 'error');
        }
    };

    return (
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[400px]">
            <Toast toast={toast} onClose={() => setToast(null)} />
            
            <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 flex items-center">
                    <ArchiveRestore className="w-5 h-5 mr-2 text-indigo-500" />
                    配置备份与恢复
                </h2>
                <p className="text-sm text-slate-500 mt-1">导出所有设置项（不包含词库数据）以便备份或迁移，或从备份文件恢复配置。</p>
            </div>

            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Export Card */}
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <Download className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">导出配置</h3>
                                    <p className="text-xs text-slate-500">生成带有详细注释的 YAML 配置文件。</p>
                                </div>
                            </div>
                            <div className="text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-100 leading-relaxed mb-4">
                                <p>包含：通用设置、视觉样式、Anki 配置、引擎密钥、悬浮球设置等。</p>
                                <p className="text-amber-600 mt-1 flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/> 注意：包含 API Key 等敏感信息，请妥善保存。</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={handleExport}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-sm flex items-center justify-center gap-2"
                            >
                                <FileText className="w-4 h-4"/> 下载文件
                            </button>
                            <button 
                                onClick={handleCopy}
                                className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition shadow-sm flex items-center justify-center"
                                title="复制到剪贴板"
                            >
                                <Copy className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>

                    {/* Import Card */}
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">恢复配置</h3>
                                    <p className="text-xs text-slate-500">上传 YAML 备份文件以覆盖当前设置。</p>
                                </div>
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                accept=".yaml,.yml,.txt" 
                                className="hidden" 
                                onChange={handleImportFile}
                            />
                            <div className="text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-100 leading-relaxed mb-4">
                                <p>支持 .yaml 或 .yml 文件。导入操作将直接覆盖当前的对应配置项，无法撤销。</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition shadow-sm flex items-center justify-center gap-2"
                        >
                            <Upload className="w-4 h-4"/> 选择备份文件
                        </button>
                    </div>
                </div>

                {/* Import Preview Area */}
                {isImporting && (
                    <div className="mt-8 pt-8 border-t border-slate-100 animate-in slide-in-from-bottom-4">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                            <span>预览待恢复的内容</span>
                            <div className="flex gap-2">
                                <button onClick={() => { setIsImporting(false); setPreviewContent(''); }} className="px-4 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg transition">取消</button>
                                <button onClick={applyImport} className="px-4 py-1.5 text-xs bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition font-bold flex items-center gap-1 shadow-sm">
                                    <RefreshCw className="w-3 h-3"/> 确认覆盖并恢复
                                </button>
                            </div>
                        </h3>
                        <div className="bg-slate-900 rounded-xl p-4 overflow-hidden border border-slate-800">
                            <textarea 
                                value={previewContent}
                                onChange={(e) => setPreviewContent(e.target.value)}
                                className="w-full h-64 bg-transparent text-emerald-400 font-mono text-xs resize-y focus:outline-none"
                                spellCheck={false}
                            />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};
