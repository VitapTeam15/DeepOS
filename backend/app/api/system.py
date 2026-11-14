from fastapi import APIRouter, Request, HTTPException
from typing import List
from app.models.schemas import SystemStatus, SystemMetrics, SystemMetricsHistory

router = APIRouter(prefix="/api/system", tags=["System"])

@router.get("/status", response_model=SystemStatus)
async def get_status(request: Request):
    mon = request.app.state.sys_mon
    status = mon.get_current_status()
    pressure = mon.get_pressure_status()
    
    if not status:
        raise HTTPException(status_code=503, detail="System metrics not available yet")
        
    return SystemStatus(
        cpu=status['cpu_percent'],
        ram=status['memory_percent'],
        disk=status['disk_percent'],
        uptime=status['boot_time'],
        pressure=pressure,
        process_count=status['process_count']
    )

@router.get("/metrics", response_model=List[SystemMetrics])
async def get_metrics(request: Request):
    mon = request.app.state.sys_mon
    return [SystemMetrics(
        timestamp=str(s.get('timestamp', '')),
        cpu_percent=s['cpu_percent'],
        memory_percent=s['memory_percent'],
        memory_used_gb=s['memory_used_gb'],
        memory_total_gb=s['memory_total_gb'],
        disk_percent=s['disk_percent'],
        disk_read_mb=s['disk_read_mb'],
        disk_write_mb=s['disk_write_mb'],
        process_count=s['process_count']
    ) for s in mon.pressure_window]
