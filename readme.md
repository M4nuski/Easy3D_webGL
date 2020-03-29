Easy3D - webGL
----------
Yet another JS 3D/game engine test

Trying out webGL, transfering most of my old Delphi and C# OpenGL game engine structure in webGL
* /ver5: current WIP
* ver5.html basic test page
* /ver4: 
* ver4.html: Works with mouse/keyboard in destktop browser, touch controls for mobile.
* ver4cellshader.html: toon shading render test and demo
* ver4fullscreen.html: pointer lock, full screen tests
* ver4stl.html: binary STL loader/viewer app 
* ver4physic.html: CD and physics test app
* ver4maze.html: Ball in Maze game, game loop and logic, random maze generation.
* 
* /Electron: content specific for Electron app
* /Images: icons / sprites / images resources
* /Models: Meshs
* /Tests: performance test for JS, gl-matrix and WebGL
* /ver0: WebGL tutorial transcript and tests, controls abstraction and demo
* /ver3: basic engine contorls, model loading

Current work-in-progress and next steps
----------
* --ver5:
* flatten engine to reduce nested calls and hierarchy walking
* extract all "DEV" stuff to a debug class
* regroup pointerlock and camera
* regroup slickhover and input
* regroup fullScreen and camera
* Other type of physics mechanic for controls. (chase camera/3rd person with spring and hit test)
* Regroup vertexArrays for mesh data (interleaved array in scene)
* interleaved array in entity
* interleaved array in loader
* Sprites (always facing viewer, shader with minimal inputs)
* Text render in 3D scene (in world, world-to-viewport)
* CD object, single for simple and array of for complex
* Improved Collision Detection with dual Interpolation and Static test (point, edge, sphere, plane, box, triangles)
* Evaluate quaternions
* --Some kind of game:
* Path interpolation for bots and animations.
* Basic AI
* 3D cube tree or AABB Collision target culling
* Sounds
* Better lights shaders (array of different types of ligts) (spot, point etc)
* NetCode
* STL, OBJ, MS3D to JSON or other ready-to-use format for mesh data and entities
* Improved Entity loading (ideally external tool should prepare model data for better load perf)
* --ver6:
* Entity hierarchy (parents with n-childs, matrix propagation etc)
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
