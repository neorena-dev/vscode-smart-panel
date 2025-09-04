import * as vscode from 'vscode';

let isPanelMaximized = false;

export function activate(context: vscode.ExtensionContext) {
    console.log('Smart Panel extension is now active!');

    // Centralized handler for state changes from various VS Code events
    const handleEditorOrTabChange = () => {
        const config = vscode.workspace.getConfiguration('smartPanel');
        const enableAutoMaximize = config.get('enableAutoMaximize', true);
        const editorOpenBehavior = config.get<'normal' | 'hidden'>('editorOpenBehavior', 'normal');

        if (!enableAutoMaximize) {
            return;
        }

        const visibleEditorsCount = vscode.window.visibleTextEditors.length;
        const totalTabs = vscode.window.tabGroups.all.reduce((sum, g) => sum + g.tabs.length, 0);
        const hasAnyEditorOrTab = visibleEditorsCount > 0 || totalTabs > 0;

        if (!hasAnyEditorOrTab) {
            // No editors or tabs open - maximize panel
            if (!isPanelMaximized) {
                vscode.commands.executeCommand('workbench.action.toggleMaximizedPanel');
                isPanelMaximized = true;
                console.log('Smart Panel: Maximized panel (no editors/tabs open)');
            }
        } else {
            // An editor/tab is present - handle based on configured behavior
            if (isPanelMaximized) {
                if (editorOpenBehavior === 'hidden') {
                    vscode.commands.executeCommand('workbench.action.closePanel');
                    isPanelMaximized = false;
                    console.log('Smart Panel: Closed panel (editor/tab opened)');
                } else {
                    vscode.commands.executeCommand('workbench.action.toggleMaximizedPanel');
                    isPanelMaximized = false;
                    console.log('Smart Panel: Restored panel to normal size (editor/tab opened)');
                }
            }
        }
    };

    // Monitor visible text editor changes
    const editorChangeDisposable = vscode.window.onDidChangeVisibleTextEditors(() => {
        handleEditorOrTabChange();
    });

    // Monitor tab changes to detect file opens while panel is maximized
    const tabsChangeDisposable = vscode.window.tabGroups.onDidChangeTabs(() => {
        handleEditorOrTabChange();
    });

    // Monitor active editor changes to handle edge cases
    const activeEditorDisposable = vscode.window.onDidChangeActiveTextEditor(() => {
        // Small delay to ensure editor state is settled
        setTimeout(() => handleEditorOrTabChange(), 100);
    });

    // Add commands for manual control
    const maximizePanelCommand = vscode.commands.registerCommand('smartPanel.maximizePanel', () => {
        if (!isPanelMaximized) {
            vscode.commands.executeCommand('workbench.action.toggleMaximizedPanel');
            isPanelMaximized = true;
            vscode.window.showInformationMessage('Smart Panel: Panel maximized');
        }
    });

    const restorePanelCommand = vscode.commands.registerCommand('smartPanel.restorePanel', () => {
        if (isPanelMaximized) {
            vscode.commands.executeCommand('workbench.action.toggleMaximizedPanel');
            isPanelMaximized = false;
            vscode.window.showInformationMessage('Smart Panel: Panel restored');
        }
    });

    const toggleAutoCommand = vscode.commands.registerCommand('smartPanel.toggleAutoMaximize', () => {
        const config = vscode.workspace.getConfiguration('smartPanel');
        const currentValue = config.get('enableAutoMaximize', true);
        config.update('enableAutoMaximize', !currentValue, vscode.ConfigurationTarget.Global);
        
        const status = !currentValue ? 'enabled' : 'disabled';
        vscode.window.showInformationMessage(`Smart Panel: Auto-maximize ${status}`);
    });

    // Register all disposables
    context.subscriptions.push(
        editorChangeDisposable,
        tabsChangeDisposable,
        activeEditorDisposable,
        maximizePanelCommand,
        restorePanelCommand,
        toggleAutoCommand
    );

    // Initialize state on activation
    setTimeout(() => {
        handleEditorOrTabChange();
    }, 500); // Delay to ensure workspace is fully loaded
}

export function deactivate() {
    console.log('Smart Panel extension is now inactive');
}
