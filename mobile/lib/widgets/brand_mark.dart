import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// The RentTa logo mark: a rooftop sheltering a speaker + karaoke mic, the
/// same pairing as the provided brand artwork's house-with-mic-and-speaker
/// icon, redrawn as a simplified glyph that stays legible at small sizes.
/// Mirrors the web app's BrandMark.jsx so both platforms show the same mark.
class BrandMark extends StatelessWidget {
  final double size;
  const BrandMark({super.key, this.size = 40});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        gradient: AppColors.brandGradient,
        shape: BoxShape.circle,
      ),
      padding: EdgeInsets.all(size * 0.22),
      child: CustomPaint(painter: _RoofMicPainter()),
    );
  }
}

class _RoofMicPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final stroke = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = size.width * 0.09
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    final fill = Paint()..color = Colors.white;

    final w = size.width;
    final h = size.height;

    // Roofline: a simple peaked "^" across the top third.
    final roof = Path()
      ..moveTo(0, h * 0.42)
      ..lineTo(w * 0.5, 0)
      ..lineTo(w, h * 0.42);
    canvas.drawPath(roof, stroke);

    // House walls, open at the bottom (just the two sides + implied floor).
    final walls = Path()
      ..moveTo(w * 0.14, h * 0.38)
      ..lineTo(w * 0.14, h)
      ..moveTo(w * 0.86, h * 0.38)
      ..lineTo(w * 0.86, h);
    canvas.drawPath(walls, stroke);

    // Speaker cabinet (left) - rounded box with a tweeter + woofer, matching
    // the artwork's speaker-next-to-mic composition under the roof.
    final speakerRect = Rect.fromLTWH(w * 0.24, h * 0.5, w * 0.2, h * 0.32);
    canvas.drawRRect(RRect.fromRectAndRadius(speakerRect, Radius.circular(w * 0.03)), stroke);
    canvas.drawCircle(Offset(speakerRect.center.dx, h * 0.6), w * 0.025, fill);
    canvas.drawCircle(Offset(speakerRect.center.dx, h * 0.73), w * 0.05, stroke);

    // Karaoke mic (right) - capsule head + stand.
    final micCenter = Offset(w * 0.67, h * 0.6);
    canvas.drawCircle(micCenter, w * 0.09, fill);
    canvas.drawLine(Offset(w * 0.67, h * 0.7), Offset(w * 0.67, h * 0.88), stroke);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Two-tone wordmark matching the artwork's "Rent" (blue) + "Ta" (green)
/// split, instead of a single flat color.
class BrandWordmark extends StatelessWidget {
  final double size;
  const BrandWordmark({super.key, this.size = 22});

  @override
  Widget build(BuildContext context) {
    return RichText(
      text: TextSpan(
        style: TextStyle(fontSize: size, fontWeight: FontWeight.w800, letterSpacing: -0.2),
        children: const [
          TextSpan(text: 'Rent', style: TextStyle(color: AppColors.primaryDark)),
          TextSpan(text: 'Ta', style: TextStyle(color: AppColors.brandGreen)),
        ],
      ),
    );
  }
}
