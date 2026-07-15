import threading, faulthandler, time, sys
def f():
    time.sleep(5)
    print('DUMPING TRACEBACK!!!', file=sys.stderr)
    faulthandler.dump_traceback(sys.stderr)
threading.Thread(target=f, daemon=True).start()
from astra_sales.celery import app
app.worker_main(['worker', '-c', '1'])
