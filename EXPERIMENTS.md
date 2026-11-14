# Experiment workspace

12 source records: Saffire-I Sample1, ten BASS-II tests, SAME-R55.

Two telemetry replays use original sensor values, original row numbers and source elapsed time. SAME-R55 retains all 1,402 rows including duplicate timestamps; Saffire uses 665 nearest original samples with control-transition rows preserved. Four BASS records include unmodified NASA videos. Remaining BASS records show experimental conditions and a static sample illustration, not synthetic telemetry.

Catalog filters cover text, material, purpose and evidence type. Up to three records can be compared by their recorded conditions. The comparison does not infer causal effects or rank universal flammability. BASS fan/air display values have unspecified units and no timed transitions. SAME mixing-fan status describes the experiment's aerosol chamber, not cabin ventilation.

The US Lab model supplies visual component geometry, not physical material composition. Component selection links to broad research topics. A sample may be placed near a component for illustration; this does not assign its material to that component. Saffire occurred in Cygnus. The authored flame is not CFD, a measured spread front, a prediction model, or a measured extinction time.

Video overlay dates differ from the experiment-table dates; the original differences are disclosed in captions. Dark source videos are preserved unchanged. Each record includes source URLs and hashes.

Rendering correction: USLab_Racks_01 and USLab_Racks_03 contain nearly binary alpha masks. They render as depth-writing alpha-tested surfaces, not sorted translucent groups. Patches1 has a fully opaque alpha channel. Original geometry, culling bounds and double-sided settings are preserved. Movement uses five rays across a small camera footprint; near clipping is 0.02 scene units.

Build: `npm run build`. Local preview: `node server.mjs`.
