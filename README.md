A simulation of a planetary system.

A JS app that, given the masses, velocities and relative distances of a star 
and surrounding planets, renders a 3D simulation of the orbits of the planets 
around the star. The physics model is comprised solely by Newton's 
gravitational field equation, which we solve to plot said orbits.

This is how a simulation looks like: ![Simulation](http://i.imgur.com/I7nUy30.png "Simulation")

You can visit a live demo here: http://ptn.github.io/kepler/

You can input the data of your choice, or you can use the dropdown list to 
choose from a few default selections.

To use on your own, simply start an http server from the directory of your 
clone and visit `/index.html`.
