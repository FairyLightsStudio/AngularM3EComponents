# Changelog

## 0.1.0

- Add container-adaptive List–Detail, Supporting and three-pane scaffolds.
- Add history-aware Hide, Expanded, Reflow and Levitate layout decisions based on current AndroidX adaptive sources.
- Preserve pane templates across layout changes; support accessible focus handling and floating panes.
- Block the layout behind a levitated pane by default with a scaffold scrim that makes the other panes inert, with `scrim` opting out and `modal` escalating to a native top-layer dialog.
- Add local navigation with four Back policies and an optional URL-backed Angular Router entry point.
- Add `levitationPosition="auto"`, which docks a floating pane to the edge the activating control sits nearest instead of a fixed configured edge.
- Add `levitationPosition="popover"`, which places a floating pane beside the activating control like a menu, flipping and clamping inside the scaffold.
- Add pair-keyed split expansion and separate floating-sheet resize state with keyboard and pointer controls.
- Add algorithm/state tests, Storybook examples and interaction coverage, and accessibility runner configuration.
- Document intentional Web differences and unsupported device-specific capabilities.
