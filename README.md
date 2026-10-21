# #850 conversation chain — PR assets

Real backend: #850 branch head b0f8fac7 (server built from the branch + a local, uncommitted scripted agent provider; sqlite; real API/WS/engine).
Light theme, 1280×800 per side, real entry, 59.5 s total. Both sides include #868's in-app confirm dialog (确认并流转 → dialog → 确认并流转).

1. /gates — left: upstream main d3c8094d; right: #850 b0f8fac7. Aligned at the 确认并流转 click (6 s).
   main plays the full-desk 「已确认并流转」 and jumps to another pending item; #850 stays, adds the separator + next task, the next node replies, the user keeps typing.
2. Run live page /runs/:id/live — left: #849 62ec6f09 (main has no live page); right: #850 b0f8fac7.
   #849 stops at 「交互已完成」 when the auto node ends; #850 continues the next node's chat in place, reply + 确认并流转 (via the dialog) there, no navigation, ends with 「运行已完成」.

- conversation-chain-before-after.png — top /gates, bottom live page (2564×2110)
- conversation-chain-compare.mp4 — side by side with Chinese captions
- conversation-chain-compare.gif — same, 10 fps, 1400 wide
