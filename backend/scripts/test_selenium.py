import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"ERROR: {exc}"))
        
        print("Navigating...")
        await page.goto("http://localhost:8000/test-viewer", wait_until="networkidle")
        await asyncio.sleep(2)
        await browser.close()

asyncio.run(main())
