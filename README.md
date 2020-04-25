# Darkify - Simple

A simple dark extension that started with the naive strategy of simply inverting everything:

```
body {
	filter: invert(100%) hue-rotate(180deg);
	background-color: #222;
}
```

Next, we just un-invert images, canvases, videos, and elements with background images - but not all such elements. Elements that are small and transparent arer left inverted.
