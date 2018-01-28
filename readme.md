Easy3D - webGL
----------
Yet another JS 3D/game engine test

Trying out webGL, transfering most of my old Delphi and C# OpenGL game engine structure in webGL

* ver4.html for current status/WIP
* ver4cellshader.html for toon shading render test and demo
* ver3.txt for engine target structure.
* tuto1.html basic re-transcript of webGL tutorial.
* tuto2.html added a lot of controls abstraction.
* ver3.html working model loading and most of engine neatly packaged.
* test1.html performance benchmarking for various JS and gl-matrix.js. 
* Works with mouse/keyboard in destktop browser, touch controls for mobile.

Current work-in-progress
----------
* Collision detection (vector, sphere/elipsoid, plane/cuboid)
* Collision physics
* Collision target culling
* Evaluate value of render culling on mobile
* Model loading (ideally external tool should prepare model data for better load perf)

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
* Other type of physics mechanic for controls.
* Sounds
* Some kind of game :P
* NetCode !
* Better lights shaders (array of different types of ligts) (spot, point etc)

-M4nuski
