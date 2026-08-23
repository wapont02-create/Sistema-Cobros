<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prosperado en Todo</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #ffffff;
            background-color: #0b0f19;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .card-container {
            position: relative;
            width: 100%;
            max-width: 700px;
            min-height: 450px;
            margin: 20px;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 3rem;
            
            /* Fondo unificado: combinación de áreas con múltiples degradados e imagen texturizada de alta calidad */
            background: 
                linear-gradient(135deg, rgba(11, 15, 25, 0.88) 0%, rgba(30, 41, 59, 0.75) 100%),
                radial-gradient(circle at top right, rgba(56, 189, 248, 0.2), transparent 60%),
                radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.15), transparent 60%),
                url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80') no-repeat center center/cover;
            
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .card-content {
            position: relative;
            z-index: 2;
        }

        .badge {
            display: inline-block;
            padding: 0.5rem 1rem;
            margin-bottom: 1.5rem;
            font-size: 0.875rem;
            font-weight: 600;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: #38bdf8;
            background: rgba(56, 189, 248, 0.1);
            border: 1px solid rgba(56, 189, 248, 0.2);
            border-radius: 50px;
        }

        h1 {
            font-size: 2.25rem;
            line-height: 1.3;
            margin-bottom: 1rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            color: #f8fafc;
        }

        p {
            font-size: 1.125rem;
            line-height: 1.6;
            color: #94a3b8;
            max-width: 550px;
            margin: 0 auto;
        }

        .verse-ref {
            margin-top: 1.5rem;
            font-size: 0.95rem;
            font-style: italic;
            color: #cbd5e1;
        }
    </style>
</head>
<body>

    <div class="card-container">
        <div class="card-content">
            <span class="badge">Enseñanza Especial</span>
            <h1>Amado, deseo que seas prosperado en todo</h1>
            <p>Y que tengas salud, así como prospera tu alma en cada paso del camino.</p>
            <div class="verse-ref">— 3 Juan 1:2</div>
        </div>
    </div>

</body>
</html>
