from app import create_app
from database.models import TestPlan

app = create_app()

with app.app_context():
    tests = TestPlan.query.all()

    for t in tests:
        print("ID:", t.id)
        print("USER:", t.user_id)
        print("QUESTIONS TYPE:", type(t.questions))
        print("QUESTIONS:", t.questions)
        print("-" * 50)