import csv
import io
from typing import List, Any

class ChunkedCSVWriter:
    """
    Streaming generator-based CSV writer.
    Ensures memory remains low and handles all UTF-8 characters and Excel formatting quirks.
    Follows Single Responsibility Principle (SRP).
    """

    @staticmethod
    def write_header(headers: List[str]) -> bytes:
        """Write the CSV header, adding UTF-8 BOM for Excel compatibility."""
        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
        writer.writerow(headers)
        # Prepend UTF-8 BOM so Excel opens it with correct encoding (UTF-8)
        return b'\xef\xbb\xbf' + output.getvalue().encode('utf-8')

    @staticmethod
    def write_rows(rows: List[List[Any]]) -> bytes:
        """Convert list of rows into CSV bytes."""
        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
        writer.writerows(rows)
        return output.getvalue().encode('utf-8')
