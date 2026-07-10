import pytest
from unittest.mock import MagicMock
from app.dicom.server import DicomServer
from app.dicom.handlers import handle_echo, handle_store

def test_dicom_server_initialization():
    server = DicomServer()
    assert server.ae is not None
    assert len(server.handlers) == 4
    # Check that EVT_C_ECHO is one of the handlers
    event_types = [h[0] for h in server.handlers]
    assert any("EVT_C_ECHO" in str(et) for et in event_types)

def test_handle_echo():
    # Mock event and connection details
    mock_event = MagicMock()
    mock_requestor = MagicMock()
    mock_requestor.ae_title = b"TEST_SCU"
    mock_requestor.address = "127.0.0.1"
    mock_event.assoc.requestor = mock_requestor

    status = handle_echo(mock_event)
    assert status == 0x0000

def test_handle_store_malformed_event():
    # Calling handle_store with a mock event where save_as fails should return 0xC000
    mock_event = MagicMock()
    mock_dataset = MagicMock()
    mock_event.dataset = mock_dataset
    mock_event.file_meta = MagicMock()
    
    # force save_as to fail
    mock_dataset.save_as.side_effect = Exception("Mocked save error")
    
    status = handle_store(mock_event)
    assert status == 0xC000
