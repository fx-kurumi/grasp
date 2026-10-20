# Frontend draft PR review assets

Recorded on upstream main `8e8a4823` (before) and each PR head (after), with the real entry
(index.html + src/main.ts, full AppShell, sidebar and theme, light and dark, 1280×800, zh-CN).
/api is mocked with Playwright `page.route`, WS with `routeWebSocket`. No harness pages.

| folder | branch | head |
|---|---|---|
| pr1-chat-shell | fe/chat-shell-and-streaming | e2b53685fe5e84a1d4d7403102ac929a27c483db |
| pr2-gate-cold | fe/gate-cold-actions (stacked on PR1) | 2f90b919a946d63d3d3c20f09755bcd04a4ee812 |
| pr3-notification-menu | fe/notification-menu | eedbab67dfcae66c120e253b12dc3d0b9e9885d0 |
| pr4-list-pages | fe/list-pages | 615600cbfa66d40a118929ac5cbf64db1226c244 |
| pr5-boot-checklist | fe/connecting-boot-checklist (stacked on PR1) | b06ac218ce02900b2b07a2f22611cc9caf7e5eba |

Compare images: left = main 8e8a4823, right = PR head. `scripts/` holds the capture scripts.
This branch holds assets only and is not meant to be merged.
