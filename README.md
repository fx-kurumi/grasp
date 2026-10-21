# #850 conversation chain — PR assets

Real backend: #850 branch head 22c01bbe (server built from the branch + a local, uncommitted scripted agent provider; sqlite; real API/WS/engine).
Light theme, 1280×800 per side, real entry, 60.6 s total.

1. /gates — left: upstream main 50afb391; right: #850 22c01bbe. Aligned at the 确认并流转 click (7.5 s).
   main jumps to another pending item; #850 stays, adds the separator + next task, the next node replies, the user keeps typing.
2. Run live page /runs/:id/live — left: #849 62ec6f09 (main has no live page); right: #850 22c01bbe.
   #849 stops at 「交互已完成」 when the auto node ends; #850 continues the next node's chat in place, reply + 确认并流转 there, no navigation.

- conversation-chain-before-after.png — top /gates, bottom live page (2564×2110)
- conversation-chain-compare.mp4 — side by side with Chinese captions
- conversation-chain-compare.gif — same, 10 fps, 1400 wide
