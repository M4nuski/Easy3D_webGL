Easy3D - webGL
----------
Yet another JS 3D/game engine test

Trying out webGL, transfering most of my old Delphi and C# OpenGL game engine structure in webGL

* /ver4: current version 0.4 WIP
* ver4.html: Works with mouse/keyboard in destktop browser, touch controls for mobile.
* ver4cellshader.html: toon shading render test and demo
* ver4fullscreen.html: pointer lock, full screen tests
* ver4stl.html: binary STL loader/viewer app 

* /Electron: content specific for Electron app
* /Images: icons / sprites / images ressources
* /Models: Meshs
* /Tests: performance test for JS, gl-matrix and WebGL
* /ver0: WebGL tutorial transcript and tests, controls abstraction and demo
* /ver3: basic engine contorls, model loading

Current work-in-progress
----------
* Collision detection (vector, sphere/elipsoid, plane/cuboid)
* Collision physics
* Collision target culling
* Evaluate value of render culling on mobile
* Model loading (ideally external tool should prepare model data for better load perf)
* STL, OBJ, MS3D

| Collisons     | Vertor  | Sphere | Plane | Cube | Traingle Mesh |
|:------------- |:-------:|:------:|:-----:|:----:|:-------------:|
| Vector        | useless |  Easy  | Easy  |  ok  |  hmm |
| Sphere        |         |  Easy  |  ok   |  hmm | nope |
| Plane         |         |        |  useless | wtf | nope |
| Cube          |         |        |       | not easy | nope |
| Triangle Mesh |         |        |       |       | NOPE |

Next Steps
-----------
* Remove scaling from matrix and entity except on load, or make separate to avoid dealing with it repeatidly. Mostly useless.
* Replace per-vertex colors with textures
* Sprites
* Other type of physics mechanic for controls. (chase camera/3rd person)
* Sounds
* Some kind of game :P
* NetCode !
* Better lights shaders (array of different types of ligts) (spot, point etc)

-M4nuski
