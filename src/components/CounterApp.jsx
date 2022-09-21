import React, { useEffect, useState } from 'react'
import * as tf from '@tensorflow/tfjs';
import model from '../models/model.json'
var  modelo = null

const CounterApp = ({value}) => {
  const [kg, setKg] = useState(0)
  const [libras, setLibras] = useState(0)

  useEffect(()=>{
    loadModel()
  },[])

  const handleChangeKg = (e)=>{
    setKg(e.target.value)
    var tensor = tf.tensor1d([parseInt(e.target.value)])
    var prediction = modelo.predict(tensor).dataSync()
    setLibras(Math.round(prediction))
  }
const loadModel = async() => {
  console.log("cargado ...")

   modelo = await tf.loadLayersModel("https://vespro.io/model.json")
  console.log("modelo cargado")

}



  return (
    <>
      <h1>Kilogramo a Libras</h1>
      <label for="customRange1" class="form-label">Example range</label>
      <input type="range"  class="form-range" id="customRange1" onChange={(e)=>{handleChangeKg(e)}}></input>
     
      <h1>{kg}</h1>
      <span>Equivale a:</span>
      <h1>{libras}</h1>

    </>
  )
}

export default CounterApp