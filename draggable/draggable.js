import { rocket } from "datastar";

rocket("sb-draggable-root", {
    props: ({ string }) => ({}),
    setup: ({ $$, action, emit }) => {
        action("grab", () => {});
    },
    render: ({ html, props: {} }) => html`
        <div>
            <slot></slot>
        </div>
    `,
});

rocket("sb-draggable-container", {
    setup: ({ $$, action, effect }) => {
        $$.dragging = false;
        $$.originalX = 0;
        $$.originalY = 0;
        $$.offsetX = 0;
        $$.offsetY = 0;
        $$.translate = "0px 0px";
        action("grabbed", (_, { x, y }) => {
            $$.dragging = true;
            $$.originalX = x;
            $$.originalY = y;
            console.log("grabbed", $$.originalX, $$.originalY)
        })
        action("released", () => {
            $$.dragging = false;
            $$.offsetX = 0;
            $$.offsetY = 0;
            console.log("released")
        })
        action("mousemove", (_, {x, y}) => {
            if ($$.dragging) {
                $$.offsetX = x - $$.originalX;
                $$.offsetY = y - $$.originalY;
                console.log("mousemove", $$.offsetX, $$.offsetY)
            }
        })
        effect(() => {
            $$.translate = `${$$.offsetX}px ${$$.offsetY}px`
        })
    },
    render: ({ html, props: {} }) => html`
        <div
            data-on:grabbed="@grabbed(evt.detail)"
            data-on:released="@released()"
            data-on:mousemove__window="@mousemove({x: evt.clientX, y: evt.clientY})"
            data-style:translate="$$translate"
        >
            <div data-text="$$translate"></div>
            <slot></slot>
        </div>
    `,
});

rocket("sb-draggable-trigger", {
    setup: ({ $$, action, emit }) => {
        $$.grabbed = false;
        action("mousedown", (_, { x, y }) => {
            $$.grabbed = true;
            emit("grabbed", {x: x, y: y});
        });
        action("mouseup", () => {
            if ($$.grabbed) {
                $$.grabbed = false;
                emit("released");
            }
        });
    },
    render: ({ html, props: {} }) => html`
        <div
            data-on:mousedown="@mousedown({x: evt.clientX, y: evt.clientY})"
            data-on:mouseup__window="@mouseup()"
        >
            <slot></slot>
        </div>
    `,
});
