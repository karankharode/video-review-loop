import {Config} from '@remotion/cli/config';

// JPEG for the opaque master; the alpha renders override this with
// --image-format=png on the command line, which transparency requires.
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer('angle');
