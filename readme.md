Easy3D - webGL
----------
Yet another JS 3D/game engine test

Trying out webGL, transfering most of my old Delphi and C# OpenGL game engine structure in webGL

Current project state is available for testing [here](https://m4nusky.com/projects/Easy3D_webGL/) (updated every 24h).

* /ver5: current WIP
* [ver5demo1.html](https://m4nusky.com/projects/Easy3D_webGL/ver5demo1.html) basic test page, skeleton html, auto-setup
* [ver5demo2.html](https://m4nusky.com/projects/Easy3D_webGL/ver5demo2.html) test page with dedicated target div, auto-setup
* [ver5demo3.html](https://m4nusky.com/projects/Easy3D_webGL/ver5demo3.html) demo for full screen and pointer lock
* [ver5demo4.html](https://m4nusky.com/projects/Easy3D_webGL/ver5demo4.html) primitive mesh generation with random parameters
* [ver5demo5.html](https://m4nusky.com/projects/Easy3D_webGL/ver5demo5.html) various basic GLSL shaders demo
* [ver5demo6.html](https://m4nusky.com/projects/Easy3D_webGL/ver5demo6.html) animator demo (Direct, Transform, Physics, Particules)
* 
* /ver4: 
* [ver4.html](https://m4nusky.com/projects/Easy3D_webGL/ver4/ver4.hmtl): Works with mouse/keyboard in desktop browser, touch controls for mobile.
* [ver4cellshader.html](https://m4nusky.com/projects/Easy3D_webGL/ver4/ver4cellshader.html): toon/cell shading render demo
* [ver4fullscreen.html](https://m4nusky.com/projects/Easy3D_webGL/ver4/ver4fullscreen.html): pointer lock, full screen demo
* [ver4stl.html](https://m4nusky.com/projects/Easy3D_webGL/ver4/ver4stl.html): binary STL loader/viewer app 
* [ver4physic.html](https://m4nusky.com/projects/Easy3D_webGL/ver4/ver4physic.html): Collisiton Detection and Physics demo
* [ver4maze.html](https://m4nusky.com/projects/Easy3D_webGL/ver4/ver4maze.html): Ball in Maze game, game loop and logic, pseudo-random maze generator.
* 
* [Memory.html](https://m4nusky.com/Memory/Memory.html): Remake of the classic "Simon" memory game. With color position shuffle!
* 
* /Electron: content specific for Electron app (STL viewer, like MS Photo or Image Viewer but for 3D stl files)
* /Images: icons / sprites / images resources
* /Models: Mesh and object data
* /Tests: [performance test](https://m4nusky.com/projects/Easy3D_webGL/tests/test1.html) for JS, [JS gl-matrix vs WebGL sahders](https://m4nusky.com/projects/Easy3D_webGL/tests/testMat.html) and [WebGL](https://m4nusky.com/projects/Easy3D_webGL/Tests/testMatShader.html)
* /ver0: WebGL [tutorial](https://m4nusky.com/projects/Easy3D_webGL/ver0/tuto1.html) transcript and tests, controls abstraction and [demo](https://m4nusky.com/projects/Easy3D_webGL/ver0/tuto2.html)
* /[ver3](https://m4nusky.com/projects/Easy3D_webGL/ver3/ver3.html): basic engine contorls, model loading

Current work-in-progress and next steps
----------
* --ver5:
* flatten engine to reduce nested calls and hierarchy walking
* extract all "DEV" stuff to a debug class
* textures
* convert all mesh, loader, generators, to LUT colors, add by-face struct
* convert all shader and scenes to LUT colors
* Regroup vertexArrays for mesh data (interleaved array in scene)
* interleaved array in entity
* interleaved array in loader
* Sprites (always facing viewer, shader with minimal inputs)
* Text render in 3D scene (in world, world-to-viewport)
* Other type of physics mechanic for controls. (chase camera/3rd person with spring and hit test)
* Improved Collision Detection with Static test handling
* Improved Collision Detection with dual Interpolation (point, edge, sphere, plane, box, triangles)
* Evaluate quaternions
* Tetris demo
* --Some kind of game:
* (3D asteroid/3D bullet hell, space war, dogfighter, horde/tower defence)
* Transform animations with state list and transitions (linear, sharp, dull)
* Path interpolation animator for bots and animations
* Basic AI
* 3D cube tree or AABB Collision target culling
* Sounds
* Better lights shaders (array of different types of ligts) (spot, point etc)
* NetCode
* STL, OBJ, MS3D to JSON or other ready-to-use format for mesh data and entities
* Improved Entity loading (ideally external tool should prepare model data for better load perf)
* --ver6:
* CD object, single for simple and array of for complex
* Entity hierarchy (parents with n-childs, matrix propagation etc)
* Mesh hierarchy (vertex bind, weight, keyframe anim and interpolation)
* Update shaders to leverage GPU matrix multiplication efficiency instead of JS engine
* Basic Physics (hit, bounce, move etc) as body data attached to entity, mass, moment of rotation etc
* Evaluate value of render culling on mobile
* CD grouping / culling
* CD cleaning to remove duplicate edges, edges in recesses
* Replace per-vertex colors with textures, using a LUT texture and LUT data set if nothing else.


Overview of collistion detection possibilities and implementation difficulty
-----------

| Entity Type   | Vertor  | Sphere | Plane | Cube | Traingle Mesh |
|:------------- |:-------:|:------:|:-----:|:----:|:-------------:|
| Vector        | useless |  Easy  | Easy  |  ok  |  hmm |
| Sphere        |         |  Easy  |  ok   |  hmm | nope |
| Plane         |         |        |  useless | wtf | nope |
| Cube          |         |        |       | not easy | nope |
| Triangle Mesh |         |        |       |       | NOPE |

Evaluations of CD and physics
-----------
* [old] Eager: test and adjust all CD for each collisions, single pass
* Shortest: test and keep only shortest hit of each source
* Average: test and note all collisions, result is average of all adjustments
* Incremental: test (eager) multiple time along path of CD solids instead of shape interpolation
* [Current] Shortest multi-pass: test all then adjust for shortest hit, mark as done, re-test for next hits n-times or until no more hits
* Progressive: Find shortest collision time, adjust all for time, recalc next pass until time reach 1 or maximum passes

Interpolations
-----------
* Point : vector
* Edge : plane
* Sphere : capsule
* Plane : box
* Box : box

-M4nuski
