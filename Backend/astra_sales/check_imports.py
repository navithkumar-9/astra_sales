import ast
import os

def check_unused_imports(directory):
    unused_imports = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.py') and file != '__init__.py':
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                try:
                    tree = ast.parse(content)
                except Exception:
                    continue
                
                imported_names = set()
                for node in ast.walk(tree):
                    if isinstance(node, ast.Import):
                        for alias in node.names:
                            imported_names.add(alias.asname or alias.name.split('.')[0])
                    elif isinstance(node, ast.ImportFrom):
                        for alias in node.names:
                            if alias.name == '*':
                                continue
                            imported_names.add(alias.asname or alias.name)
                            
                used_names = set()
                for node in ast.walk(tree):
                    if isinstance(node, ast.Name):
                        used_names.add(node.id)
                    elif isinstance(node, ast.Attribute):
                        if isinstance(node.value, ast.Name):
                            used_names.add(node.value.id)
                
                unused = imported_names - used_names
                unused = {u for u in unused if u not in ['annotations', 'TYPE_CHECKING', 'Any', 'Optional', 'List', 'Dict', 'Tuple']}
                if unused:
                    unused_imports.append((filepath, unused))
                    
    return unused_imports

if __name__ == '__main__':
    backend_dir = "/app/core"
    results = check_unused_imports(backend_dir)
    for filepath, unused in results:
        print(f"{filepath}: Unused imports {unused}")
