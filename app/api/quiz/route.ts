import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { EntryType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const typesParam = searchParams.get("types");
    const countParam = searchParams.get("count");

    const types = typesParam ? typesParam.split(",") as EntryType[] : [];
    const count = countParam ? parseInt(countParam, 10) : 10;

    if (types.length === 0) {
      return NextResponse.json(
        { error: "At least one entry type required" },
        { status: 400 }
      );
    }

    // Fetch entries matching the selected types
    const entries = await prisma.entry.findMany({
      where: {
        userId: user.id,
        isTemplate: false,
        type: { in: types },
      },
      select: {
        id: true,
        type: true,
        title: true,
        content: true,
        metadata: true,
      },
    });

    // Shuffle entries using Fisher-Yates
    const shuffled = [...entries];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Take requested count
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    // Also return entry counts by type for the setup UI
    const typeCounts = await prisma.entry.groupBy({
      by: ["type"],
      where: {
        userId: user.id,
        isTemplate: false,
      },
      _count: { type: true },
    });

    const countsByType: Record<string, number> = {};
    typeCounts.forEach((tc) => {
      countsByType[tc.type] = tc._count.type;
    });

    return NextResponse.json({
      entries: selected,
      totalAvailable: entries.length,
      countsByType,
    });
  } catch (error) {
    console.error("Quiz entries error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz entries" },
      { status: 500 }
    );
  }
}
