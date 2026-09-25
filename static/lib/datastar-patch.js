import { action, mergePatch } from "datastar";

/**
 * @typedef {object} PatchElementsOptions
 * @property {string} [selector]
 * @property {"outer" | "inner" | "replace" | "prepend" | "append" | "before" | "after" | "remove"} [mode]
 * @property {"html" | "svg" | "mathml"} [namespace]
 * @property {boolean} [useViewTransition]
 * @property {string} [viewTransitionSelector]
 */

/**
 * @typedef {object} RunContext
 * @property {(elements: string | Element | DocumentFragment, options?: PatchElementsOptions) => void} patchElements
 * @property {(signals: Record<string, any>, options?: { onlyIfMissing?: boolean }) => void} patchSignals
 * @property {import("datastar").HTMLOrSVG} el
 * @property {Event} [evt]
 */

/**
 * @callback RunHandler
 * @param {RunContext} ctx
 * @param {...any} args
 * @returns {void | Promise<void>}
 */

action({
    name: "run",
    /** @param {RunHandler} handler */
    apply: ({ el, evt, error }, handler, ...args) => {
        if (typeof handler !== "function") throw error("RunExpectedFunction");
        return handler(
            {
                el,
                evt,
                patchElements: (
                    elements,
                    { selector, mode, namespace, useViewTransition, viewTransitionSelector } = {},
                ) =>
                    document.dispatchEvent(
                        new CustomEvent("datastar-fetch", {
                            detail: {
                                type: "datastar-patch-elements",
                                el,
                                // The watcher parses args like SSE data lines, so booleans must be the string "true".
                                argsRaw: {
                                    elements,
                                    selector,
                                    mode,
                                    namespace,
                                    useViewTransition: useViewTransition ? "true" : undefined,
                                    viewTransitionSelector,
                                },
                            },
                        }),
                    ),
                patchSignals: (signals, { onlyIfMissing } = {}) =>
                    mergePatch(signals, { ifMissing: onlyIfMissing }),
            },
            ...args,
        );
    },
});
