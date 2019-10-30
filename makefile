
# Get the latest babylon definitions file and build
planetgen.js:
	curl -O https://preview.babylonjs.com/babylon.d.ts
	tsc
