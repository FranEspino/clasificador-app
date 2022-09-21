import React, { useEffect, useRef, useState} from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";
const FACING_MODE_USER = "user";
const FACING_MODE_ENVIRONMENT = "environment";

const videoConstraints = {
  facingMode: FACING_MODE_USER
};

var modelo = null;

const Clasificador = () => {
    const [facingMode, setFacingMode] = React.useState(FACING_MODE_USER);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const otrocanvasRef = useRef(null);
  const [prediction,setPrediction] = useState("");

  useEffect(() => {
    loadModel();
  }, []);

  useEffect(() => {
    setInterval(() => {
      detect();
      predecir();
    }, 150);
  }, []);

  const loadModel = async () => {
    console.log("cargado ...");
    modelo = await tf.loadLayersModel("https://vespro.io/model.json");
    console.log("modelo cargado");
  };

  function resample_single(canvas, width, height, resize_canvas) {
    var width_source = canvas.current.width;
    var height_source = canvas.current.height;
    width = Math.round(width);
    height = Math.round(height);

    var ratio_w = width_source / width;
    var ratio_h = height_source / height;
    var ratio_w_half = Math.ceil(ratio_w / 2);
    var ratio_h_half = Math.ceil(ratio_h / 2);

    var ctx = canvas.current.getContext("2d");
    var ctx2 = resize_canvas.current.getContext("2d");
    var img = ctx.getImageData(
      0,
      0,
      Number(width_source),
      Number(height_source)
    );
    var img2 = ctx2.createImageData(width, height);
    var data = img.data;
    var data2 = img2.data;

    for (var j = 0; j < height; j++) {
      for (var i = 0; i < width; i++) {
        var x2 = (i + j * width) * 4;
        var weight = 0;
        var weights = 0;
        var weights_alpha = 0;
        var gx_r = 0;
        var gx_g = 0;
        var gx_b = 0;
        var gx_a = 0;
        var center_y = (j + 0.5) * ratio_h;
        var yy_start = Math.floor(j * ratio_h);
        var yy_stop = Math.ceil((j + 1) * ratio_h);
        for (var yy = yy_start; yy < yy_stop; yy++) {
          var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
          var center_x = (i + 0.5) * ratio_w;
          var w0 = dy * dy; //pre-calc part of w
          var xx_start = Math.floor(i * ratio_w);
          var xx_stop = Math.ceil((i + 1) * ratio_w);
          for (var xx = xx_start; xx < xx_stop; xx++) {
            var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
            var w = Math.sqrt(w0 + dx * dx);
            if (w >= 1) {
              //pixel too far
              continue;
            }
            //hermite filter
            weight = 2 * w * w * w - 3 * w * w + 1;
            var pos_x = 4 * (xx + yy * width_source);
            //alpha
            gx_a += weight * data[pos_x + 3];
            weights_alpha += weight;
            //colors
            if (data[pos_x + 3] < 255)
              weight = (weight * data[pos_x + 3]) / 250;
            gx_r += weight * data[pos_x];
            gx_g += weight * data[pos_x + 1];
            gx_b += weight * data[pos_x + 2];
            weights += weight;
          }
        }
        data2[x2] = gx_r / weights;
        data2[x2 + 1] = gx_g / weights;
        data2[x2 + 2] = gx_b / weights;
        data2[x2 + 3] = gx_a / weights_alpha;
      }
    }

    ctx2.putImageData(img2, 0, 0);
  }

  const predecir = () => {
    if (modelo != null) {
      resample_single(canvasRef, 100, 100, otrocanvasRef);
      var ctx2 = canvasRef.current.getContext("2d");
      var imgData = ctx2.getImageData(0, 0, 100, 100);
      var arr = [];
      var arr100 = [];

      for (var p = 0; p < imgData.data.length; p += 4) {
        var rojo = imgData.data[p] / 255;
        var verde = imgData.data[p + 1] / 255;
        var azul = imgData.data[p + 2] / 255;

        var gris = (rojo + verde + azul) / 3;

        arr100.push([gris]);
        if (arr100.length == 100) {
          arr.push(arr100);
          arr100 = [];
        }
      }

      arr = [arr];
      var tensor = tf.tensor4d(arr);

      var prediccion = modelo.predict(tensor).dataSync();
      if (prediccion <= 0.4) {
        setPrediction("Gato 😸")
      } else {
       setPrediction("Perro 🐶")

      }
    }
  };

  const detect = async () => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      // Set canvas width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // Get canvas context
      const ctx = canvasRef.current.getContext("2d");
      ctx.drawImage(
        video,
        0,
        0,
        videoWidth,
        videoHeight,
        0,
        0,
        videoWidth,
        videoHeight
      );
    }
  };

  return (
    <div className="flex flex-col justify-center items-center">
      <Webcam
        ref={webcamRef}
        audio={false}
        facingMode="user"
        style={{
          width: 640,
          height: 480,
        }}
        videoConstraints={{
            ...videoConstraints,
            facingMode
          }}
      />
      <h2 className=" text-4xl font-black text-center "> {prediction}</h2>
      <button onClick={()=>{setFacingMode(FACING_MODE_ENVIRONMENT)}}>Switch camera</button>

      <canvas
        ref={canvasRef}
        style={{
          display: "none",
          textAlign: "center",
          width: 640,
          height: 480,
        }}
      />

      <canvas
        ref={otrocanvasRef}
        style={{
          display: "none",
          textAlign: "center",
          width: 100,
          height: 100,
        }}
      />
    </div>
  );
};

export default Clasificador;
