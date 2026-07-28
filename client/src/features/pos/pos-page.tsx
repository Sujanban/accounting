import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { useProducts } from "../masters/use-masters";

type CartLine = { id: string; name: string; barcode?: string | null; sellingPrice: number; quantity: number };

export function PosPage() {
  const navigate = useNavigate();
  const products = useProducts();
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const scan = () => {
    const value = barcode.trim();
    const product = products.data?.find((item) => item.barcode === value || item.sku === value);
    if (!product) { setMessage("No active product matches that barcode or SKU."); return; }
    setCart((lines) => { const line = lines.find((item) => item.id === product.id); return line ? lines.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...lines, { id: product.id, name: product.name, barcode: product.barcode, sellingPrice: product.sellingPrice, quantity: 1 }]; });
    setBarcode(""); setMessage(null);
  };
  const total = cart.reduce((sum, line) => sum + line.sellingPrice * line.quantity, 0);
  return <Flex direction="column" gap="5"><div><Heading size="7">Point of sale</Heading><Text color="gray">Scan catalog barcodes, build a counter-sale cart, then post through Sales Vouchers.</Text></div><Card size="3"><form className="accounting-form" onSubmit={(event) => { event.preventDefault(); scan(); }}><label className="accounting-form__wide">Barcode or SKU<input value={barcode} onChange={(event) => setBarcode(event.target.value)} autoFocus placeholder="Scan barcode" /></label><div className="accounting-form__actions"><Button type="submit">Add to cart</Button></div></form>{message ? <Text color="red" role="alert">{message}</Text> : null}</Card><Card size="3"><Heading size="4">Cart</Heading>{cart.length ? <><table className="accounting-table"><thead><tr><th>Item</th><th>Quantity</th><th>Rate</th><th>Total</th></tr></thead><tbody>{cart.map((line) => <tr key={line.id}><td>{line.name}</td><td><input aria-label={`${line.name} quantity`} type="number" min="1" value={line.quantity} onChange={(event) => setCart((lines) => lines.map((item) => item.id === line.id ? { ...item, quantity: Math.max(1, Number(event.target.value) || 1) } : item))} /></td><td>{line.sellingPrice.toFixed(2)}</td><td>{(line.quantity * line.sellingPrice).toFixed(2)}</td></tr>)}</tbody></table><Flex justify="between" align="center" mt="3"><Text weight="bold">Total: {total.toFixed(2)}</Text><Button onClick={() => navigate("/vouchers/sales/new", { state: { posCart: cart } })}>Continue to sales voucher</Button></Flex></> : <Text color="gray">Scan a barcode or enter a SKU to start a cart.</Text>}</Card></Flex>;
}
