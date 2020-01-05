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

Current work-in-progress and next steps
----------
* Collision detection (vector, sphere/elipsoid, plane/cuboid)
* Remove scaling from matrix and entity except on load, or implement in shader to avoid dealing with it repeatidly. Mostly useless.
* Update shaders to leverage GPU matrix multiplication efficiency instead of JS engine
* Validate Input model flexibility
* Validate Input scheme switching / UI / UX
* --Some kind of game:
* Path interpolation for bots and animations.
* Basic AI
* Collision target culling (local)
* Sounds
* Better lights shaders (array of different types of ligts) (spot, point etc)
* NetCode
* --ver5:
* Abstraction of basic Collision physics (hit, bounce, move etc)
* Evaluate value of render culling on mobile
* Sprites (always facing viewer, shader with minimal inputs)
* STL, OBJ, MS3D to JSON or other ready-to-use format for mesh data and entities
* Improved Entity loading (ideally external tool should prepare model data for better load perf)
* --ver6:
* Replace per-vertex colors with textures, using a LUT texture and LUT data set if nothing else.
* Other type of physics mechanic for controls. (chase camera/3rd person)

Overview of collistion detection possibilities and implementation difficulty
-----------

| Collisons     | Vertor  | Sphere | Plane | Cube | Traingle Mesh |
|:------------- |:-------:|:------:|:-----:|:----:|:-------------:|
| Vector        | useless |  Easy  | Easy  |  ok  |  hmm |
| Sphere        |         |  Easy  |  ok   |  hmm | nope |
| Plane         |         |        |  useless | wtf | nope |
| Cube          |         |        |       | not easy | nope |
| Triangle Mesh |         |        |       |       | NOPE |

-M4nuski
