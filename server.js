require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const ODOO_URL = process.env.ODOO_URL;
const DB = process.env.DB;
const USERNAME = "sistemas@storemaple.com";
const PASSWORD = process.env.PASSWORD;

const FEATURED_CODES = [
    "DS-2CD2346G2P-ISU/SL(C)", "DS-2CD2T46G2P-ISU/SL(C)", "DS-2CD2743G2-IZS",
    "DS-2CD3T87G2P-LSU/SL(C)", "DS-2CD6365G1-IVS", "DS-2CD63C5G1-IVS",
    "DS-6901UDI(C)", "DS-7104NI-K1/W/M(C)", "DS-7108NI-K1/W/M(C)",
    "DS-7604NI-Q1/W", "DS-7608NXI-I2/8P/S(E)", "DS-7608NXI-K2/8P(D)",
    "DS-7616NI-M2/16P", "DS-7616NXI-I2/16P/S(E)", "DS-7616NXI-I2/16P/VPRO",
    "DS-7716NI-M4/16P", "DS-7716NXI-I4/16P/S(E)", "DS-7716NXI-I4/16P/VPRO",
    "DS-7716NXI-K4(D)", "DS-7716NXI-K4/16P(D)", "DS-7732NI-M4/16P",
    "DS-7732NXI-I4/16P/VPRO", "DS-7732NXI-K4/16P(E)", "DS-9632NI-M8",
    "DS-TCG406-E(S)", "IDS-2CD7186G2-IZS", "IDS-2CD7A45G2-IZHS",
    "IDS-7608NXI-M2/8P/X", "IDS-7616NXI-M2/16P/X", "IPC-B460HAD-LUF/SL",
    "IPC-B480HAD-LUF/SL", "IPC-T260HAD-LUF/SL", "IPC-T280HAD-LUF/SL",
    "DS-PDP15P-EG2-WB(B)", "DS-PDMC-EG2-WB(B)", "DS-PDMCS-EG2-WB(B)",
    "DS-PS1-E-WB/B", "DS-PS1-E-WB/R", "DS-PDCM15PF-IR",
    "DS-PKF1-WB(B)", "DS-PK1-E-WB", "DS-PS403I-WB",
    "DS-PDMCX-E-WB", "DS-PDP18-HM-WB", "DS-PK1-LT-WB",
    "DS-PDPC12P-EG2-WB(B)", "DS-PD452SMK-WB", "DS-PD201P10-WB",
    "DS-PD201MC-WB", "DS-PKF201-WB", "DS-PS201-WB",
    "DS-PK201B-WB", "DS-PD201PC10-WB", "DS-PC201N"
];

app.get('/api/productos', async (req, res) => {
    try {
        const authResponse = await fetch(`${ODOO_URL}/jsonrpc`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "call",
                params: {
                    service: "common",
                    method: "authenticate",
                    args: [DB, USERNAME, PASSWORD, {}]
                },
                id: 1
            })
        });

        const authData = await authResponse.json();

        if (authData.error) {
            throw new Error(`Odoo Error: ${authData.error.data?.message || authData.error.message}`);
        }

        const uid = authData.result;
        if (!uid) {
            return res.status(401).json({ error: "Autenticación fallida. Verifica que el nombre de tu base de datos en la variable DB sea exacto." });
        }

        const dataResponse = await fetch(`${ODOO_URL}/jsonrpc`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "call",
                params: {
                    service: "object",
                    method: "execute_kw",
                    args: [
                        DB,
                        uid,
                        PASSWORD,
                        'product.template',
                        'search_read',
                        [[
                            ['default_code', 'in', FEATURED_CODES],
                            ['website_published', '=', true]
                        ]],
                        {
                            fields: [
                                "id", "name", "default_code", "description_purchase", "website_url", 
                                "description_sale", "list_price", "currency_id", 
                                "image_512"
                            ],
                            context: { bin_size: true }
                        }
                    ]
                },
                id: 2
            })
        });

        const dataJson = await dataResponse.json();

        if (dataJson.error) {
            throw new Error(`Error en consulta: ${dataJson.error.data?.message || dataJson.error.message}`);
        }

        const productosConImagen = dataJson.result.map(producto => ({
            ...producto,
            image_url: `${ODOO_URL}/web/image/product.template/${producto.id}/image_512`
        }));

        res.json(productosConImagen);

    } catch (error) {
        console.error('Error en el servidor API:', error.message);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({ status: 'API de Odoo funcionando correctamente 🚀', endpoint: '/api/productos' });
});

app.listen(PORT, () => {
    console.log(`Servidor API JSON-RPC corriendo en http://localhost:${PORT}/api/productos`);
});