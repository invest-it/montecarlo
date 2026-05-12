- [ ] clean up the old rust stuff (threading)
- [ ] implement investit design
- [ ] implement room support


/* CLAUDE */
1. Read crates/core/src/v2/assumptions and check for major bugs
2. Expose the data of assumptions.rs to the frontend (wasm) so that the user can see which Assets are available and constructing the AssetSelection is easier.
3. Implement mod.rs for v2 package and add exports to lib.rs. If possible introduce a new struct for the JavaValue objects that are returned to the callback. Also let the user pass in their own AssetSelection (but this must be validated before running the sim).
4. Update the wasm function calls in mc_worker.ts to use the new wasm exports.


/* CLAUDE END */
