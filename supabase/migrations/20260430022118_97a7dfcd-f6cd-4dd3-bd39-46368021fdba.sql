-- Eliminar categoría duplicada 'partes-para-servidores' (sin hijos)
-- Reasignar productos asignados a ese slug hacia 'partes-servidores' (la que tiene hijos)
UPDATE products SET category = 'Partes para Servidores'
WHERE category IN ('partes-para-servidores', 'Partes para servidores');

DELETE FROM categories WHERE slug = 'partes-para-servidores';