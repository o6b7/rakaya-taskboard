import * as Icons from "lucide-react";
import type { SVGProps } from "react";
import React from "react";

export function getLucideIcon(
  name: string,
  props: SVGProps<SVGSVGElement> = {}
): React.ReactElement {
  if (!name) return React.createElement(Icons.HelpCircle, props);

  const formattedName =
    name.charAt(0).toUpperCase() + name.slice(1); 

  const IconsMap = Icons as unknown as Record<string, React.FC<SVGProps<SVGSVGElement>>>;
  const IconComponent = IconsMap[formattedName];

  return React.createElement(IconComponent || Icons.HelpCircle, props);
}
