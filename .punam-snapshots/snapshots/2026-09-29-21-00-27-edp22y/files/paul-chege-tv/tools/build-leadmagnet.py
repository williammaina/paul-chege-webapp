#!/usr/bin/env python3
"""Generates the free download: The Offer Letter Checklist.

    /tmp/claude-1000/venv/bin/python tools/build-leadmagnet.py
"""
from fpdf import FPDF
import os

NAVY = (10, 17, 40)
GOLD = (168, 132, 42)
GOLD_L = (212, 175, 55)
INK = (42, 54, 84)
MUTED = (110, 127, 163)
HERE = os.path.dirname(__file__)
OUT = os.path.join(HERE, "..", "public", "downloads", "offer-letter-checklist.pdf")
LOGO = os.path.join(HERE, "..", "public", "img", "logo.png")

SECTIONS = [
    ("Before you read a single number", [
        "Ask for the offer letter in writing. Never accept terms given only over the phone.",
        "Check the facility amount is the money you receive, not the money you repay.",
        "Confirm the tenure in months, and the exact first repayment date.",
        "Ask whether the rate is fixed or variable. If variable, ask what it is pegged to.",
    ]),
    ("The cost of the money", [
        "Nominal interest rate per annum, written as a number, not a range.",
        "The total you will repay over the full term. Ask for this figure in shillings.",
        "Arrangement or negotiation fee, and whether it is deducted up front.",
        "Credit life insurance premium, and whether you may use your own insurer.",
        "Legal, valuation and stamp duty costs, and who pays them.",
        "Ledger, service or monthly maintenance fees.",
        "Excise duty on fees, which is charged separately from the interest.",
    ]),
    ("The clauses that decide your outcome", [
        "Early settlement penalty: how much, and for how long it applies.",
        "The set-off clause, which lets the bank take money from your other accounts.",
        "Default interest rate, and when it starts.",
        "What counts as an event of default besides missing a payment.",
        "Whether the bank may vary the rate unilaterally, and with what notice.",
        "Cross-default: whether trouble on another facility triggers this one.",
        "Security: what is pledged, and what happens on a shortfall at auction.",
    ]),
    ("If you are being offered a top-up", [
        "Ask for the outstanding balance on the existing facility, today.",
        "Ask how much interest you have already paid on that balance.",
        "Ask whether the top-up reprices the whole balance or only the new money.",
        "Ask whether the clock resets to a full new term.",
        "Model it against consolidating. The difference is often six figures.",
        "Ask what the penalty would be to settle the existing loan instead.",
    ]),
    ("Before you sign", [
        "Take the letter away. A lender who will not give you a night to think is telling you something.",
        "Read the exclusions in the credit life policy, not just the premium.",
        "Confirm the disbursement date and the account it lands in.",
        "Keep a signed copy. You will need it if anything is disputed.",
        "If any answer above is vague, put the question in writing and keep the reply.",
    ]),
]


class PDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*MUTED)
        self.cell(0, 8, "The Offer Letter Checklist  ·  Paul Chege Consultancy TV", align="L")
        self.ln(10)

    def footer(self):
        self.set_y(-16)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*MUTED)
        self.cell(0, 5, "paulchege.co.ke   ·   Bizsure USSD *519*30#   ·   info@bizsure.co.ke", align="C")
        self.ln(4)
        self.cell(0, 5, f"Page {self.page_no()}", align="C")


pdf = PDF(format="A4")
pdf.set_auto_page_break(auto=True, margin=22)
pdf.set_margins(20, 20, 20)
pdf.add_page()

# cover band
pdf.set_fill_color(*NAVY)
pdf.rect(0, 0, 210, 82, "F")
if os.path.exists(LOGO):
    pdf.image(LOGO, x=20, y=14, h=18)
pdf.set_xy(20, 40)
pdf.set_font("Helvetica", "B", 26)
pdf.set_text_color(255, 255, 255)
pdf.cell(0, 10, "The Offer Letter Checklist")
pdf.set_xy(20, 54)
pdf.set_font("Helvetica", "", 12)
pdf.set_text_color(212, 175, 55)
pdf.cell(0, 8, "29 questions to ask your bank before you sign")

pdf.set_xy(20, 94)
pdf.set_font("Helvetica", "", 11)
pdf.set_text_color(*INK)
pdf.multi_cell(170, 6,
    "Most Kenyans lose six figures to a clause nobody explained to them. Not because the "
    "clause was hidden, but because nobody knew which four pages of fourteen actually "
    "decide the outcome.\n\n"
    "Work down this list with the offer letter in front of you. Tick what you can answer. "
    "Anything you cannot answer is a question for your relationship manager, in writing, "
    "before you sign.")
pdf.ln(4)
pdf.set_draw_color(*GOLD_L)
pdf.set_line_width(0.8)
pdf.line(20, pdf.get_y(), 60, pdf.get_y())
pdf.ln(8)

for title, items in SECTIONS:
    if pdf.get_y() > 235:
        pdf.add_page()
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(*NAVY)
    pdf.multi_cell(170, 7, title)
    pdf.ln(1.5)
    for it in items:
        if pdf.get_y() > 262:
            pdf.add_page()
        y = pdf.get_y()
        pdf.set_draw_color(*GOLD)
        pdf.set_line_width(0.4)
        pdf.rect(20, y + 1.2, 3.6, 3.6)
        pdf.set_xy(27, y)
        pdf.set_font("Helvetica", "", 10.5)
        pdf.set_text_color(*INK)
        pdf.multi_cell(163, 5.6, it)
        pdf.ln(1.2)
    pdf.ln(4)

# closing page
pdf.add_page()
pdf.set_fill_color(*NAVY)
pdf.rect(20, 30, 170, 92, "F")
pdf.set_xy(30, 44)
pdf.set_font("Helvetica", "B", 16)
pdf.set_text_color(255, 255, 255)
pdf.cell(0, 8, "Still not sure?")
pdf.set_xy(30, 58)
pdf.set_font("Helvetica", "", 11)
pdf.set_text_color(200, 212, 235)
pdf.multi_cell(150, 6,
    "Bring the offer letter to a free 30-minute review. We will read it together, model the "
    "cost against the alternatives, and you will leave knowing exactly what you are signing.")
pdf.set_xy(30, 92)
pdf.set_font("Helvetica", "B", 11)
pdf.set_text_color(212, 175, 55)
pdf.cell(0, 6, "Book at paulchege.co.ke/booking   ·   Dial *519*30#")

pdf.set_xy(20, 136)
pdf.set_font("Helvetica", "", 9)
pdf.set_text_color(*MUTED)
pdf.multi_cell(170, 5,
    "This checklist is general financial education. It does not take account of your "
    "circumstances and is not personal financial advice. Your lender's offer letter governs. "
    "Insurance is arranged through Bizsure Insurance Brokers, regulated by the Insurance "
    "Regulatory Authority of Kenya.\n\n"
    "(c) Paul Chege Consultancy TV. Share it freely; please do not sell it.")

os.makedirs(os.path.dirname(OUT), exist_ok=True)
pdf.output(OUT)
print("wrote", OUT, round(os.path.getsize(OUT) / 1024), "KB",
      "·", sum(len(i) for _, i in SECTIONS), "checklist items")
