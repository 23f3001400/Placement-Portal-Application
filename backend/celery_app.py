from celery import Celery, Task
from celery.schedules import crontab


def celery_init_app(app):

    class FlaskTask(Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery = Celery(app.name, task_cls=FlaskTask)
    celery.config_from_object(app.config["CELERY"])

    # Auto-discover tasks in the tasks/ package
    celery.autodiscover_tasks(["tasks"])

    # Celery Beat schedule
    celery.conf.beat_schedule = {
        "send-daily-reminders": {
            "task": "tasks.reminders.send_daily_reminders",
            "schedule": crontab(hour=8, minute=0),  # 08:00 AM IST daily
        },
        "send-monthly-report": {
            "task": "tasks.monthly_report.send_monthly_report",
            "schedule": crontab(hour=9, minute=0, day_of_month=1),  # 1st of every month
        },
    }

    celery.set_default()
    app.extensions["celery"] = celery
    return celery
