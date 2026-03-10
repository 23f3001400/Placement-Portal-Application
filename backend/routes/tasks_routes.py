import os
from flask import Blueprint, jsonify, send_from_directory, current_app
from flask_security import auth_required, roles_required, current_user
from celery.result import AsyncResult

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/student")


@tasks_bp.route("/export-applications", methods=["POST"])
@auth_required("token")
@roles_required("student")
def trigger_export():
    s = current_user.student
    if not s:
        return jsonify(msg="Student profile not found."), 404

    from tasks.export_csv import export_applications_csv

    result = export_applications_csv.delay(s.id)
    return jsonify(task_id=result.id, msg="Export started."), 202


@tasks_bp.route("/export-status/<task_id>", methods=["GET"])
@auth_required("token")
@roles_required("student")
def export_status(task_id):
    result = AsyncResult(task_id)
    response = {"task_id": task_id, "state": result.state}

    if result.state == "SUCCESS" and result.result:
        response["filename"] = result.result.get("filename", "")
        response["count"] = result.result.get("count", 0)
    elif result.state == "FAILURE":
        response["error"] = str(result.result)

    return jsonify(response), 200


@tasks_bp.route("/export-download/<filename>", methods=["GET"])
@auth_required("token")
@roles_required("student")
def export_download(filename):
    export_dir = current_app.config["EXPORT_FOLDER"]
    filepath = os.path.join(export_dir, filename)
    if not os.path.isfile(filepath):
        return jsonify(msg="File not found."), 404
    return send_from_directory(export_dir, filename, as_attachment=True)
