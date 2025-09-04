/*
 * Vencord Plugin: TemporaryHideMessage
 * Temporarily hides a message from view until Discord is reloaded.
 * © 2025 You | MIT License
 */

import definePlugin from "@utils/types";
import { React, Menu } from "@webpack/common";
import { findGroupChildrenByChildId } from "@api/ContextMenu";
import { Message } from "@vencord/discord-types";

// In-memory Set of hidden message IDs (cleared on reload)
const hiddenMessages = new Set<string>();

/**
 * Adds "Hide Message (Temporary)" to the right-click context menu on messages
 */
function addHideMessageContextItem(children: any[], props: { message: Message }) {
    const group = findGroupChildrenByChildId("message-actions", children);
    if (!group || !props?.message?.id) return;

    const messageId = props.message.id;

    group.children.push(
        <Menu.MenuItem
            id="vc-hide-message-temporary"
            label="Hide Message (Temporary)"
            action={() => {
                hiddenMessages.add(messageId);
            }}
        />
    );
}

export default definePlugin({
    name: "TemporaryHideMessage",
    description: "Temporarily hides messages until the client reloads.",
    authors: [{ id: 1169111190824308768n, name: "Akuma" }],

    contextMenus: {
        message: addHideMessageContextItem,
    },

    patches: [
        {
            find: "children.map((msg,index)=>",
            replacement: {
                // Injects filtering logic into message rendering
                match: /children\.map\(\(msg,index\)=>/,
                replace: "children = children.filter(msg => !globalThis.vcHiddenMessages?.has(msg.id)); $&"
            }
        }
    ],

    onLoad() {
        // Expose the hidden message set globally for patch access
        globalThis.vcHiddenMessages = hiddenMessages;
    },

    onUnload() {
        // Clean up global reference
        delete globalThis.vcHiddenMessages;
    }
});
