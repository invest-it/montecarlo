- [ ] clean up the old rust stuff (threading)
- [ ] implement investit design
- [ ] implement room support


/* CLAUDE */
1. Read crates/core/src/v2/assumptions and check for major bugs
2. Expose the data of assumptions.rs to the frontend (wasm) so that the user can see which Assets are available and constructing the AssetSelection is easier.
3. SimConfig and SimConfigWithAssumptions currently exposes dt and n_steps. Please introduce a new Enum with the type DAYS and MONTHS and YEARS. This enum value should be passed to the sim from the frontend (default DAYS). When Days is selected use dt = 1/250 per default, when MONTHS 1/12 per default
4. Implement mod.rs for v2 package and add exports to lib.rs. If possible introduce a new struct for the JavaValue objects that are returned to the callback. Also let the user pass in their own AssetSelection (but this must be validated before running the sim).
5. Update the wasm function calls in mc_worker.ts to use the new wasm exports but keep both v1 and v2 versions available by specifying the version in the RunMessage and choosing in the worker.


Now some UI changes: Currently the user sees for different Charts on the same screen. By clicking on a Chart is should be possible to open it in a new https://daisyui.com/components/modal/ in fullscreen.
In the config side bar add a new toggle to switch between days and years and to set the step count. Years should translate to 12 * step_count and the months enum when passed to the wasm binding


/* CLAUDE END */
