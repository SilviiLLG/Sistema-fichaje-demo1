from flask import Flask, render_template, request, redirect, url_for, session, flash, send_file, jsonify
from io import BytesIO
from datetime import datetime
from functools import wraps
import os
import pandas as pd

app = Flask(__name__, template_folder="templates", static_folder="static")
app.secret_key = os.getenv("SECRET_KEY", "clave-demo-cambiar-en-produccion")

# Credenciales exclusivamente demostrativas. No reutilizar en un sistema real.
DEMO_USER = "demo"
DEMO_PASSWORD = "demo1234"


def admin_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("admin"):
            return redirect(url_for("login"))
        return view(*args, **kwargs)
    return wrapped


@app.route("/")
def home():
    return redirect(url_for("fichar"))


@app.route("/fichar")
def fichar():
    return render_template("fichar.html")


@app.route("/historial")
def historial():
    return render_template("historial.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        usuario = request.form.get("usuario", "")
        clave = request.form.get("clave", "")
        if usuario == DEMO_USER and clave == DEMO_PASSWORD:
            session["admin"] = True
            return redirect(url_for("admin_panel"))
        flash("Usuario o contraseña incorrectos.", "danger")
    return render_template("login.html")


@app.route("/logout")
def logout():
    session.pop("admin", None)
    return redirect(url_for("fichar"))


@app.route("/admin")
@admin_required
def admin_panel():
    return render_template("admin_panel.html")


@app.route("/resumen")
@admin_required
def resumen():
    return render_template("resumen.html")


@app.route("/exportar", methods=["POST"])
@admin_required
def exportar():
    payload = request.get_json(silent=True) or {}
    pasantes = payload.get("pasantes", [])
    fichajes = payload.get("fichajes", [])

    pasantes_por_id = {str(p.get("id")): p for p in pasantes}
    filas = []
    for f in fichajes:
        p = pasantes_por_id.get(str(f.get("pasante_id")), {})
        filas.append({
            "ID": f.get("pasante_id", ""),
            "Nombre": p.get("nombre", "Pasante eliminado"),
            "Turno": p.get("turno", ""),
            "Fecha": f.get("fecha", ""),
            "Hora": f.get("hora", ""),
            "Horas": f.get("horas", 0)
        })

    df = pd.DataFrame(filas, columns=["ID", "Nombre", "Turno", "Fecha", "Hora", "Horas"])
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Fichajes")
    output.seek(0)

    nombre = f"fichajes_demo_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    return send_file(
        output,
        as_attachment=True,
        download_name=nombre,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


@app.errorhandler(404)
def not_found(_error):
    return render_template("error.html", code=404, message="La página que buscás no existe."), 404


@app.errorhandler(500)
def server_error(_error):
    return render_template("error.html", code=500, message="Ocurrió un error inesperado."), 500


if __name__ == "__main__":
    app.run(debug=True)
