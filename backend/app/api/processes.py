from fastapi import APIRouter, Request, HTTPException
from app.models.schemas import ProcessList, ProcessInfo, TerminateResponse

router = APIRouter(prefix="/api/processes", tags=["Processes"])

@router.get("/", response_model=ProcessList)
async def list_processes(request: Request):
    procs = request.app.state.proc_mon.get_processes()
    result = []
    for p in procs:
        result.append(ProcessInfo(
            pid=p['pid'],
            name=p['name'],
            cpu_percent=p['cpu_percent'],
            memory_percent=p['memory_percent'],
            memory_mb=p['memory_mb'],
            status=p['status'],
            username=p['username'],
            is_protected=request.app.state.proc_mon.is_protected(p['name'])
        ))
    return ProcessList(processes=result)

@router.get("/top/cpu", response_model=ProcessList)
async def top_cpu(request: Request, n: int = 10):
    procs = request.app.state.proc_mon.get_top_cpu(n)
    result = []
    for p in procs:
        result.append(ProcessInfo(
            pid=p['pid'],
            name=p['name'],
            cpu_percent=p['cpu_percent'],
            memory_percent=p['memory_percent'],
            memory_mb=p['memory_mb'],
            status=p['status'],
            username=p['username'],
            is_protected=request.app.state.proc_mon.is_protected(p['name'])
        ))
    return ProcessList(processes=result)

@router.get("/top/memory", response_model=ProcessList)
async def top_memory(request: Request, n: int = 10):
    procs = request.app.state.proc_mon.get_top_memory(n)
    result = []
    for p in procs:
        result.append(ProcessInfo(
            pid=p['pid'],
            name=p['name'],
            cpu_percent=p['cpu_percent'],
            memory_percent=p['memory_percent'],
            memory_mb=p['memory_mb'],
            status=p['status'],
            username=p['username'],
            is_protected=request.app.state.proc_mon.is_protected(p['name'])
        ))
    return ProcessList(processes=result)

@router.post("/{pid}/terminate", response_model=TerminateResponse)
async def terminate(request: Request, pid: int, confirm: bool = False):
    if not confirm:
        raise HTTPException(status_code=400, detail="Explicit user confirmation required (confirm=true)")
    success, msg = request.app.state.proc_mon.terminate_process(pid, confirm=confirm)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return TerminateResponse(success=True, message=msg)
