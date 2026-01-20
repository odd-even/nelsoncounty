#!/usr/bin/env python3
"""
Robust CSV parsing utilities that handle common CSV issues gracefully.

Features:
- BOM handling (UTF-8-sig)
- Encoding detection and fallback
- Graceful handling of malformed rows
- Column count mismatch recovery
- Empty row filtering
- Detailed error reporting without crashing
"""

import csv
import io
import re
from pathlib import Path


class CSVError:
    """Represents a non-fatal CSV parsing issue"""
    def __init__(self, row_num, message, data=None):
        self.row_num = row_num
        self.message = message
        self.data = data
    
    def __str__(self):
        return f"Row {self.row_num}: {self.message}"


class RobustCSVReader:
    """
    A robust CSV reader that handles common parsing issues gracefully.
    
    Usage:
        reader = RobustCSVReader(filepath)
        rows = reader.read()
        
        if reader.errors:
            print(f"Encountered {len(reader.errors)} issues:")
            for error in reader.errors:
                print(f"  {error}")
        
        print(f"Successfully parsed {len(rows)} rows")
    """
    
    def __init__(self, filepath):
        self.filepath = Path(filepath)
        self.fieldnames = []
        self.errors = []
        self.warnings = []
        self.rows = []
    
    def read(self, skip_empty=True, fix_column_count=True):
        """
        Read CSV file with robust error handling.
        
        Args:
            skip_empty: Skip rows that are entirely empty
            fix_column_count: Attempt to fix rows with wrong column counts
        
        Returns:
            List of dictionaries (rows)
        """
        self.errors = []
        self.warnings = []
        self.rows = []
        
        if not self.filepath.exists():
            self.errors.append(CSVError(0, f"File not found: {self.filepath}"))
            return []
        
        # Try different encodings
        content = None
        encoding_used = None
        
        for encoding in ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252']:
            try:
                with open(self.filepath, 'r', encoding=encoding) as f:
                    content = f.read()
                encoding_used = encoding
                break
            except UnicodeDecodeError:
                continue
        
        if content is None:
            self.errors.append(CSVError(0, "Could not decode file with any known encoding"))
            return []
        
        if encoding_used != 'utf-8-sig' and encoding_used != 'utf-8':
            self.warnings.append(f"File was read using {encoding_used} encoding (not UTF-8)")
        
        # Remove any leftover BOM
        if content.startswith('\ufeff'):
            content = content[1:]
            self.warnings.append("Removed BOM character from file content")
        
        # Check for empty file
        if not content.strip():
            self.errors.append(CSVError(0, "File is empty"))
            return []
        
        # Parse CSV
        try:
            reader = csv.reader(io.StringIO(content))
            all_rows = list(reader)
        except csv.Error as e:
            self.errors.append(CSVError(0, f"CSV parsing error: {e}"))
            return []
        
        if not all_rows:
            self.errors.append(CSVError(0, "No rows found in CSV"))
            return []
        
        # Get header
        self.fieldnames = all_rows[0]
        expected_cols = len(self.fieldnames)
        
        # Clean fieldnames (remove BOM artifacts, whitespace)
        self.fieldnames = [self._clean_fieldname(f) for f in self.fieldnames]
        
        # Process data rows
        for row_num, row in enumerate(all_rows[1:], start=2):
            # Skip empty rows
            if skip_empty and (not row or all(cell.strip() == '' for cell in row)):
                continue
            
            actual_cols = len(row)
            
            # Handle column count mismatch
            if actual_cols != expected_cols:
                if fix_column_count:
                    if actual_cols < expected_cols:
                        # Pad with empty strings
                        row = row + [''] * (expected_cols - actual_cols)
                        self.warnings.append(f"Row {row_num}: Padded {expected_cols - actual_cols} missing columns")
                    else:
                        # Truncate (but log the extra data)
                        extra = row[expected_cols:]
                        row = row[:expected_cols]
                        self.warnings.append(f"Row {row_num}: Truncated {actual_cols - expected_cols} extra columns (data: {extra[:3]}...)")
                else:
                    self.errors.append(CSVError(row_num, f"Column count mismatch: expected {expected_cols}, got {actual_cols}", row))
                    continue
            
            # Create row dict
            row_dict = {}
            for i, fieldname in enumerate(self.fieldnames):
                row_dict[fieldname] = row[i] if i < len(row) else ''
            
            self.rows.append(row_dict)
        
        return self.rows
    
    def _clean_fieldname(self, name):
        """Clean a fieldname of BOM artifacts and whitespace"""
        if name:
            # Remove BOM and other non-printable characters
            name = name.strip().lstrip('\ufeff').strip()
            # Remove any other leading/trailing whitespace
            name = name.strip()
        return name
    
    def get_summary(self):
        """Get a summary of the parsing results"""
        lines = [
            f"File: {self.filepath}",
            f"Rows parsed: {len(self.rows)}",
            f"Columns: {len(self.fieldnames)}",
        ]
        
        if self.warnings:
            lines.append(f"Warnings: {len(self.warnings)}")
        
        if self.errors:
            lines.append(f"Errors: {len(self.errors)}")
        
        return "\n".join(lines)


class RobustCSVWriter:
    """
    A robust CSV writer with validation and error handling.
    
    Usage:
        writer = RobustCSVWriter(filepath, fieldnames)
        writer.write(rows)
        
        if writer.errors:
            print(f"Encountered {len(writer.errors)} issues while writing")
    """
    
    def __init__(self, filepath, fieldnames):
        self.filepath = Path(filepath)
        self.fieldnames = fieldnames
        self.errors = []
        self.warnings = []
    
    def write(self, rows, quoting=csv.QUOTE_MINIMAL):
        """
        Write rows to CSV with robust error handling.
        
        Args:
            rows: List of dictionaries to write
            quoting: CSV quoting style (default: QUOTE_MINIMAL)
        
        Returns:
            True if successful, False if there were errors
        """
        self.errors = []
        self.warnings = []
        
        if not rows:
            self.warnings.append("No rows to write")
        
        # Validate and clean rows
        clean_rows = []
        for i, row in enumerate(rows, start=1):
            clean_row = {}
            
            for field in self.fieldnames:
                value = row.get(field, '')
                
                # Handle None values
                if value is None:
                    value = ''
                    self.warnings.append(f"Row {i}: Field '{field}' was None, converted to empty string")
                
                # Ensure string type
                if not isinstance(value, str):
                    try:
                        value = str(value)
                    except Exception as e:
                        self.errors.append(CSVError(i, f"Could not convert field '{field}' to string: {e}"))
                        value = ''
                
                clean_row[field] = value
            
            # Check for unexpected fields
            extra_fields = set(row.keys()) - set(self.fieldnames)
            if extra_fields:
                self.warnings.append(f"Row {i}: Ignored extra fields: {extra_fields}")
            
            clean_rows.append(clean_row)
        
        # Write the file
        try:
            with open(self.filepath, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(
                    f, 
                    fieldnames=self.fieldnames, 
                    quoting=quoting, 
                    doublequote=True
                )
                writer.writeheader()
                writer.writerows(clean_rows)
        except Exception as e:
            self.errors.append(CSVError(0, f"Failed to write file: {e}"))
            return False
        
        return len(self.errors) == 0


def read_csv_robust(filepath, **kwargs):
    """
    Convenience function to read a CSV file robustly.
    
    Args:
        filepath: Path to CSV file
        **kwargs: Additional arguments passed to RobustCSVReader.read()
    
    Returns:
        Tuple of (rows, fieldnames, errors, warnings)
    """
    reader = RobustCSVReader(filepath)
    rows = reader.read(**kwargs)
    return rows, reader.fieldnames, reader.errors, reader.warnings


def write_csv_robust(filepath, rows, fieldnames, **kwargs):
    """
    Convenience function to write a CSV file robustly.
    
    Args:
        filepath: Path to CSV file
        rows: List of dictionaries
        fieldnames: List of column names
        **kwargs: Additional arguments passed to RobustCSVWriter.write()
    
    Returns:
        Tuple of (success, errors, warnings)
    """
    writer = RobustCSVWriter(filepath, fieldnames)
    success = writer.write(rows, **kwargs)
    return success, writer.errors, writer.warnings


# Example usage and testing
if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python robust_csv.py <csv_file>")
        print("\nThis will test the robust CSV reader on the specified file.")
        sys.exit(1)
    
    filepath = sys.argv[1]
    print(f"Testing robust CSV reader on: {filepath}\n")
    
    reader = RobustCSVReader(filepath)
    rows = reader.read()
    
    print(reader.get_summary())
    print()
    
    if reader.warnings:
        print(f"Warnings ({len(reader.warnings)}):")
        for w in reader.warnings[:10]:
            print(f"  - {w}")
        if len(reader.warnings) > 10:
            print(f"  ... and {len(reader.warnings) - 10} more")
        print()
    
    if reader.errors:
        print(f"Errors ({len(reader.errors)}):")
        for e in reader.errors[:10]:
            print(f"  - {e}")
        if len(reader.errors) > 10:
            print(f"  ... and {len(reader.errors) - 10} more")
        print()
    
    if rows:
        print(f"First row fields: {list(rows[0].keys())[:5]}...")
        print(f"Sample data from first row:")
        for key in list(rows[0].keys())[:3]:
            val = rows[0][key]
            if len(val) > 50:
                val = val[:50] + "..."
            print(f"  {key}: {val}")

