/*
 * Vencord Plugin: MessageFormatter
 * Adds context menu options to format your own message (spoiler, bold, quote, strikethrough).
 */

import definePlugin from "@utils/types";
import { Menu, RestAPI, showToast, Toasts, UserStore } from "@webpack/common";
import { findGroupChildrenByChildId } from "@api/ContextMenu";
import { Message } from "@vencord/discord-types";

function addFormatOptions(children: any[], props: { message: Message }) {
    const message = props?.message;
    const currentUser = UserStore.getCurrentUser();

    if (!message || message.author.id !== currentUser.id) return;

    const group = findGroupChildrenByChildId("message-actions", children);

    const formattingOptions = [
        {
            id: "vc-format-spoiler",
            label: "Spoiler",
            condition: () => !(message.content.startsWith("||") && message.content.endsWith("||")),
            format: (content: string) => `||${content}||`,
            toast: "Your message is now a spoiler!",
        },
        {
            id: "vc-format-bold",
            label: "Bold",
            condition: () => !(message.content.startsWith("**") && message.content.endsWith("**")),
            format: (content: string) => `**${content}**`,
            toast: "Boldified!",
        },
        {
            id: "vc-format-quote",
            label: "Quote",
            condition: () => !message.content.startsWith("> "),
            format: (content: string) => `> ${content}`,
            toast: "Quoted!",
        },
        {
            id: "vc-format-strike",
            label: "Strikethrough",
            condition: () => !(message.content.startsWith("~~") && message.content.endsWith("~~")),
            format: (content: string) => `~~${content}~~`,
            toast: "Struck it out!",
        },
    ];

    const formatMenuItems = formattingOptions
        .filter(opt => opt.condition())
        .map(opt => (
            <Menu.MenuItem
                id={opt.id}
                label={opt.label}
                action={() =>
                    formatMessage(
                        message.channel_id,
                        message.id,
                        message.content,
                        opt.format,
                        opt.toast
                    )
                }
            />
        ));

    if (group) {
        group.children.push(...formatMenuItems);
    } else {
        children.push(...formatMenuItems);
    }
}

/**
 * Edit the message with a given format
 */
async function formatMessage(
    channelId: string,
    messageId: string,
    content: string,
    formatFn: (c: string) => string,
    toastMsg: string
) {
    const newContent = formatFn(content);

    try {
        await RestAPI.patch({
            url: `/channels/${channelId}/messages/${messageId}`,
            body: { content: newContent },
        });
        showToast(toastMsg, Toasts.Type.SUCCESS);
    } catch (err) {
        console.error("[MessageFormatter] Failed to edit message:", err);
        showToast("Failed to edit message.", Toasts.Type.FAILURE);
    }
}

export default definePlugin({
    name: "MessageFormatter",
    description: "Adds context menu options to wrap or prefix your own messages with markdown (spoiler, bold, quote, strikethrough).",
    authors: [{ id: 1169111190824308768n, name: "Akuma" }],
    contextMenus: {
        message: addFormatOptions,
    },
});
