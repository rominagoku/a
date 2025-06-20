import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Cadena de conexión desde variable de entorno
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri);

async function conectar() {
  try {
    await client.connect();
    console.log("✅ Conectado a MongoDB Atlas");
  } catch (error) {
    console.error("❌ Error al conectar a MongoDB Atlas:", error);
  }
}

conectar();

const db = client.db("paecromina");
const coleccion = db.collection("actividades");

// Alta - crear nuevo registro
app.post("/alta", async (req, res) => {
  try {
    const actividad = req.body;
    // Aquí asume que id_actividad es único, validamos que no exista
    const existe = await coleccion.findOne({ id_actividad: actividad.id_actividad });
    if (existe) {
      return res.status(400).json({ error: "El ID de actividad ya existe." });
    }
    await coleccion.insertOne(actividad);
    res.status(201).json({ message: "Actividad creada correctamente." });
  } catch (error) {
    res.status(500).json({ error: "Error al crear actividad." });
  }
});

// Baja - eliminar por id_actividad
app.post("/baja", async (req, res) => {
  try {
    const { id_actividad } = req.body;
    const resultado = await coleccion.deleteOne({ id_actividad: id_actividad });
    if (resultado.deletedCount === 0) {
      return res.status(404).json({ error: "No se encontró la actividad con ese ID." });
    }
    res.json({ message: "Actividad eliminada correctamente." });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar actividad." });
  }
});

// Actualizar - actualizar un solo campo según selección
app.post("/actualizar", async (req, res) => {
  try {
    const { id_actividad, campo, nuevo_valor } = req.body;
    if (!id_actividad || !campo || nuevo_valor === undefined) {
      return res.status(400).json({ error: "Faltan datos para la actualización." });
    }
    const update = { $set: { [campo]: nuevo_valor } };
    const resultado = await coleccion.updateOne({ id_actividad: id_actividad }, update);
    if (resultado.matchedCount === 0) {
      return res.status(404).json({ error: "No se encontró la actividad con ese ID." });
    }
    res.json({ message: "Actividad actualizada correctamente." });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar actividad." });
  }
});

// Visualizar - obtener todas las actividades
app.get("/api/actividades", async (req, res) => {
  try {
    const actividades = await coleccion.find().toArray();
    res.json(actividades);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener actividades." });
  }
});

// Servir index.html en raíz
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "./public" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

